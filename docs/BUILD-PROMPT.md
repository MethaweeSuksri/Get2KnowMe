# Implementation prompt — portfolio site

Paste everything below the line into Claude Code. Attach or place the files listed under **Inputs** in the project directory first.

---

Build a static portfolio website and a résumé PDF, both generated from a single JSON data file. The design is already approved — do not redesign it. Your job is to implement it correctly.

## Inputs (in the project directory)

| File | Role |
|---|---|
| `portfolio.public.json` | **The only source of content.** Never hardcode a string that exists here. |
| `B1-layout-spec.md` | Layout, section order, interaction behaviour, and the reasoning |
| `ARCHITECTURE.md` | Data flow, rendering boundary, résumé pipeline |
| `Resume.reference.html` | Approved résumé markup — port it, do not redesign it |
| `Portfolio Site UI Build.zip` | Approved design in Claude Design's `.dc` format. **Reference only** — it needs a proprietary runtime and hardcodes its own copy of the data. Read it for layout and interaction; port nothing verbatim. |

## Stack

- **Next.js, App Router, TypeScript.** Every page statically generated.
- **Do NOT use `output: 'export'`.** A serverless route handler is needed later for a mini-game; static export forbids it. Default Next.js on Vercel already pre-renders pages with no dynamic data.
- **Plain CSS with custom properties.** No Tailwind, no CSS-in-JS. The design system is 23 tokens and four spacing steps.
- Deploy target is Vercel. No runtime server, no database.

## Rule zero

**`portfolio.public.json` is read at build time and never at runtime.**

No `fetch()` of it, no embedding it in a `<script>` tag, no shipping it to `public/`. Import it in server components only. If a value reaches the browser it must be because a component wrote it into the markup.

Corollary: **never render a key beginning with `_`.** None exist in the input; none may be introduced.

## File layout

```
portfolio.public.json
lib/
  types.ts              types generated from the schema
  portfolio.ts          load, validate, build indexes  ← the core
  css-tokens.ts         emit design tokens + highlight rules as CSS text
app/
  layout.tsx
  page.tsx              landing
  p/[id]/page.tsx       one page per project, via generateStaticParams
  resume/page.tsx       the PDF's source
  globals.css
components/
  Header.tsx  IdentityBand.tsx  ExperienceList.tsx
  ProjectGrid.tsx  ProjectCard.tsx  SkillsRail.tsx  SkillChip.tsx
  HighlightRoot.tsx     'use client' — the ONLY stateful component
  DomainFilter.tsx      'use client'
public/
  Methawee_Suksri_Resume.pdf   committed artifact
scripts/
  make-resume.mjs       puppeteer print
```

## 1. `lib/portfolio.ts` — build this first

Load the JSON, validate it, and export four indexes:

```ts
skillById        Map<string, Skill>
skillsByProject  Map<projectId, skillId[]>
projectsBySkill  Map<skillId, projectId[]>    // inversion of the above
projectsByDomain Map<domainId, projectId[]>
```

`projectsBySkill` is `skillsByProject` inverted. That inversion **is** the bidirectional hover feature; there is no other logic behind it.

**Validation must throw and fail the build** when:
- a project, experience, or leadership entry references a skill `id` not in the registry
- a project references a `domain` id not in `domains`
- a skill's `category` is not in `skillCategories`
- any key beginning with `_` is found anywhere (defence in depth)

A silently missing chip is invisible; a red build is not.

Also export `projects` sorted by `priority` descending.

## 2. Design tokens — use these exact values

From the approved design. Emit as CSS custom properties on `:root`.

```css
--bg:            oklch(1 0 0);
--surface:       oklch(0.98 0 0);
--text:          oklch(0.18 0 0);
--text-muted:    oklch(0.46 0 0);
--border:        oklch(0.88 0 0);
--border-strong: oklch(0.7 0 0);
--accent:        oklch(0.5 0.14 250);
--accent-soft:   oklch(0.95 0.03 250);

--domain-backend:  oklch(0.55 0.11 250);
--domain-web:      oklch(0.55 0.11 155);
--domain-graphics: oklch(0.6 0.15 40);
--domain-systems:  oklch(0.55 0.09 290);
--domain-mobile:   oklch(0.6 0.13 340);
--domain-gamedev:  oklch(0.62 0.13 90);
--domain-tooling:  oklch(0.55 0.09 200);

--cat-languages:       oklch(0.55 0.13 260);
--cat-web-backend:     oklch(0.55 0.13 200);
--cat-graphics:        oklch(0.6 0.15 40);
--cat-databases-cloud: oklch(0.55 0.12 150);
--cat-tools-systems:   oklch(0.55 0.1 300);
--cat-cs-fundamentals: oklch(0.55 0.11 20);
--cat-sdlc:            oklch(0.6 0.12 90);
--cat-leadership:      oklch(0.55 0.12 340);
```

Layout constants from the approved build: page `max-width: 1280px`; body grid `2.5fr 1fr`; project grid `1fr 1fr`; skills rail `position: sticky; top: 64px`; header height 64px; prose `max-width: 70ch`. Type scale 11 / 12 / 12.5 / 13 / 14 / 15 / 16 / 17 / 18 / 28px, line-height 1.2 for headings and 1.5 for body. Gaps 4 / 6 / 8 / 12 / 16 / 40px.

Keep every colour in a custom property so dark mode can be added later without touching components.

## 3. Highlighting — CSS-driven, not React-driven

Do **not** re-render on hover. Every skill id is known at build time, so generate the rules.

Markup carries the relationships as static attributes:

```html
<article class="card" data-skills="python opencv img-stitch homography">
<span class="chip" data-skill="python">
```

`lib/css-tokens.ts` emits one pair of rules per skill at build time:

```css
[data-active="python"] .card:not([data-skills~="python"]) { opacity: .4 }
[data-active="python"] .chip:not([data-skill="python"])   { opacity: .4 }
```

~75 skills, roughly 6 KB of CSS. `HighlightRoot` sets a single attribute:

```tsx
<div data-active={active ?? undefined} onPointerLeave={() => setActive(null)}>
```

Requirements:
- **Opacity, colour, and border only.** Never height, width, margin, padding, transform, or font-size. Zero layout shift is a hard requirement.
- 120ms ease, fires immediately with no delay.
- `:focus-visible` behaves identically to `:hover`. Fully keyboard-navigable.
- Click pins the highlight; Escape clears it.
- `@media (prefers-reduced-motion: reduce)` drops the transition, keeps the effect.
- Hovering a skill that has a `contexts` field (no project evidence) shows that text in a tooltip instead of dimming everything.

## 4. Domain filter — the URL is the state

`/?domain=graphics,backend` — multi-select, OR logic.

Read with `useSearchParams`; write with `router.replace(..., { scroll: false })`. Component state must not be the source of truth: back button, reload, and shared links all have to work. `/?domain=graphics` is how a tailored link gets sent with an application.

Non-matching cards hide via the same attribute mechanism so filtering composes with highlighting. Skills with no remaining visible project dim. Show a "Clear" control when a filter is active.

## 5. The layer boundary — this is the whole design

| Field | Landing `/` | Project `/p/[id]` |
|---|---|---|
| tagline, team, skills, domains | yes | yes |
| summary, highlights | yes | yes |
| `engineering` | **never** | yes |
| media | no | yes |
| any `_` key | never | never |

Not hidden with CSS — **absent from the DOM.** Landing-page components must never read `project.engineering`. The site serves recruiters scanning for 40 seconds and engineers reading for 15 minutes; this boundary is how both are served without compromise.

## 6. Pages

**`/` landing.** Sticky header (name, "Get Creative" as a quiet/muted link, "↓ Résumé" as the only filled button, linking to `/Methawee_Suksri_Resume.pdf`). Identity band with education folded in. Two-column body: experience then projects on the left, sticky skills rail on the right. Leadership as a compact full-width band at the bottom. Footer.

Project cards: title linking to **`/p/<id>`** (never to GitHub — the repo is a separate labelled link), tagline, team badge, context and year, up to 6 skill chips then `+N`, 3-line clamped summary on word boundaries, "Technical detail →".

Chips use `shortLabel` when present. **The rail and the résumé always use the full `label`.** Never abbreviate at render time.

**`/p/[id]`.** `generateStaticParams` over all six projects. Back link, title, tagline, team, year, repo link, 16:9 grey media placeholder labelled with what will fill it, summary, highlights, architecture, decisions as `what / why / instead-of / ref` rows with the ref in monospace, skill chips linking back to `/?domain=…`. Prose and cards share one content width.

**`/resume`.** Port `Resume.reference.html`, rebuilt to read from the JSON. Exactly one A4 page. Single-column document flow — no CSS multi-column, no tables — because ATS parsers read across gutters and garble multi-column text. Real selectable text, no icons, no images, standard section headings, no running headers or footers, system fonts.

**No phone number anywhere.** If you find one in the reference HTML, drop it.

## 7. Résumé PDF

`scripts/make-resume.mjs` uses Puppeteer to print `/resume` to `public/Methawee_Suksri_Resume.pdf`, A4, 12–15 mm margins, `printBackground: false`.

`public/` is copied at the start of the build, so the PDF cannot be produced by the deploying build. Wire it as `npm run resume`, run manually, commit the output.

Add a `postbuild` check that fails if the PDF is missing or older than `portfolio.public.json`, so drift is caught rather than shipped.

## 8. Later, do not build now

`app/play/` and a creative-mode page, linked **from the footer only**. `app/api/*` route handlers for the game's backend. This is why static export is off the table.

## Deliverables

1. A project that runs with `npm run dev` and builds with `npm run build`.
2. All six project pages generated from the data — **not hand-authored**.
3. Working bidirectional highlighting and URL-synced filtering.
4. `npm run resume` producing a one-page PDF.
5. Responsive to 375px. Single column below 768px; the rail moves below projects and tap-to-pin replaces hover.
6. A short note listing any spec decision you disagreed with and why — I would rather hear it than have it silently changed.

## Acceptance checks

- `grep -r '"_' .next/server/app` returns nothing
- No landing-page HTML contains any string from an `engineering` block
- Breaking a skill id in the JSON fails the build with a clear message
- Every page renders readable content with JavaScript disabled
- Lighthouse: CLS 0, accessibility 100
- Landing page under 100 KB total transfer

## Anti-goals

No hero section. No animated gradients. No cards that lift or scale on hover. No "crafting digital experiences" copy. This is a dense, information-first document that happens to be well designed — closer to a well-set résumé than a landing page.
