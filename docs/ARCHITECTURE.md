# Architecture

Companion to `portfolio.json`, `B1-layout-spec.md`, `PROJECT-BRIEF.md`.

---

## Your summary, checked

| You said | Verdict |
|---|---|
| Static site, free hosting, Vercel | Correct |
| React application | Correct — with one condition: **pre-rendered**, never client-only |
| Résumé generated from the JSON at build time | Correct in principle, one practical wrinkle — see §5 |
| Résumé button links to the PDF | Correct |
| Game and "creative" mode later, dynamic | Correct — and it changes the framework choice now |

The only thing I'd change: **use Next.js, not Vite + React.**

I earlier recommended vanilla plus a Node generator. Two things have changed since: you want React, and you want a small backend for the mini-game. Vercel plus Next.js gives you statically generated pages *and* serverless functions in one project, on one free tier, with no infrastructure. Vite would mean building the static site now and finding somewhere else to host the game's backend later.

## 1. The one rule everything else serves

**`portfolio.json` is read at build time and never at runtime.**

The browser never fetches it. No `fetch('/portfolio.json')`, no JSON in a `<script>` tag. Every string is baked into HTML during the build.

Three consequences, all of them wins:

- Nothing private can leak, because only the fields a component explicitly read are in the output.
- Link previews work. A recruiter pasting your URL into LinkedIn gets a title and description, because they're in the HTML.
- It's fast, and it works with JavaScript disabled.

## 2. Stack

```
Next.js (App Router)   static generation for every page
React                  components
Plain CSS or CSS Modules   — no Tailwind needed; the spec's system is 4 spacing
                             steps and one accent colour
Vercel                 hosting, free tier, GitHub-connected
Puppeteer              résumé HTML → PDF (dev/CI dependency only)
```

**Do not use `output: 'export'`.** It produces a pure static folder but forbids route handlers — which kills the mini-game backend. Default Next.js on Vercel already pre-renders every page you write without dynamic data; you get static HTML *and* the option of `app/api/*` later.

## 3. Layout

```
portfolio.json                  ← the PUBLIC version. This is the repo's copy.
lib/
  portfolio.ts                  ← loads JSON, builds indexes, exports typed data
  types.ts
app/
  layout.tsx                    ← shell, fonts, CSS variables
  page.tsx                      ← landing page (static)
  p/[id]/page.tsx               ← project pages via generateStaticParams
  resume/page.tsx               ← the PDF's source
components/
  IdentityBand.tsx              ← server component
  ExperienceList.tsx            ← server component
  ProjectGrid.tsx               ← server component
  SkillsRail.tsx                ← server component
  HighlightProvider.tsx         ← the ONLY client component ('use client')
  DomainFilter.tsx              ← client
public/
  Methawee_Suksri_Resume.pdf    ← committed build artifact
scripts/
  make-resume.mjs               ← puppeteer print
```

`portfolio.annotated.json` — the one with `_actionItems` and `_prep` — **stays off the repo.** Gitignored. The build needs nothing from it.

## 4. The data layer is where the features live

`lib/portfolio.ts` runs once at build time and computes the indexes the UI needs:

```ts
skillById         Map<id, Skill>              → resolve a chip
projectsBySkill   Map<skillId, projectId[]>   → hover a skill, light up projects
skillsByProject   Map<projectId, skillId[]>   → hover a project, light up skills
projectsByDomain  Map<domainId, projectId[]>  → the filter
skillsByCategory  Map<categoryId, Skill[]>    → the rail
```

`projectsBySkill` is just `skillsByProject` inverted. That inversion **is** the bidirectional hover feature — there is no other logic. Build it once here and both directions are free.

This module also validates. If a project references a skill id that isn't in the registry, **throw and fail the build**. A silent missing chip is a bug you'd never notice; a red build is one you fix in thirty seconds.

## 5. The résumé, and its one awkward corner

`app/resume/page.tsx` renders from the same data as everything else. `scripts/make-resume.mjs` points Puppeteer at it and prints one page to PDF.

The wrinkle: **that PDF must exist in `public/` before the build runs**, because `public/` is copied into the deployment. So it can't be produced by the same build that deploys it. Two honest options:

**Option A — commit the PDF (start here).**

```json
"scripts": { "resume": "node scripts/make-resume.mjs" }
```

You edit content, run `npm run resume`, commit both the JSON and the PDF, push. Vercel deploys. Simple, no CI, works today.

Its weakness is the one I flagged: forget to re-run it and your résumé silently disagrees with your site.

**Option B — CI does it (do this once you're bored of Option A).**

A GitHub Action on push: install, build, run the script, commit the regenerated PDF back, and let that commit trigger Vercel. Now the PDF cannot drift, because no human is responsible for it.

Either way, the button is a plain link:

```html
<a href="/Methawee_Suksri_Resume.pdf" download>↓ Résumé</a>
```

A real file at a stable URL. No client-side generation, no waiting, and it survives being right-clicked and saved.

## 6. How the highlighting should actually work

The obvious approach is React state: `onMouseEnter` sets `hoveredSkill`, everything re-renders with new classNames. It works, but it re-renders 6 cards and 60 chips on every pointer move across the rail.

Better, and it exploits the fact that **every skill id is known at build time**:

```tsx
// One client component wraps the grid and the rail.
<div data-active={active ?? undefined} onPointerOut={() => setActive(null)}>
```

Each card and chip carries its ids as a static attribute:

```html
<article class="card" data-skills="python opencv img-stitch homography">
<span class="chip" data-skill="python">
```

Then generate the rules once, at build time, from the skill list:

```css
[data-active="python"] .card:not([data-skills~="python"]) { opacity: .4 }
[data-active="python"] .chip:not([data-skill="python"])   { opacity: .4 }
/* ×75 skills — about 6 KB of CSS, gzipped to almost nothing */
```

Hovering sets **one attribute on one element.** The browser recalculates styles; React re-renders nothing. That makes the spec's two hardest rules trivially true: instant, and no layout shift, because only `opacity` changes.

`:focus-visible` gets the same treatment, so keyboard navigation is free. Click toggles `active` into a pinned state; Escape clears it.

## 7. The filter's state is the URL

```
/?domain=graphics,backend
```

Read with `useSearchParams`, write with `router.replace(..., { scroll: false })`. The URL is the single source of truth, not component state.

Why it matters: back button works, the link is shareable — which is the whole reason we cut emphasis modes — and reload preserves what you were looking at.

Filtering hides cards with `display: none` via the same attribute trick, so it composes with highlighting instead of fighting it.

## 8. The layer boundary, enforced

| | Landing `/` | Project `/p/[id]` |
|---|---|---|
| tagline, team, chips, domains | yes | yes |
| summary, highlights | yes | yes |
| **`engineering`** | **never** | yes |
| media | no | yes |
| `_` anything | never | never |

Not "hidden with CSS" — **not in the DOM.** The landing page's components never read `project.engineering`. That's the whole HR-first design, expressed as which component reads which field.

## 9. Later: the game and creative mode

This is why Next.js rather than a static export.

```
app/play/page.tsx           the game, client component
app/api/score/route.ts      serverless function, runs on Vercel
```

Vercel's free tier covers the function. If scores need persistence, Vercel KV or a free Postgres — one env var, no server to run. Nothing about the static portfolio changes.

Both `/play` and the creative page are linked **from the footer only.** A recruiter never encounters them; an engineer ten minutes in finds them exactly when curious.

## 10. Build

```
git push
   ↓
Vercel: npm ci → next build
   ↓
lib/portfolio.ts reads portfolio.json, validates refs, builds indexes
   ↓
static HTML for /, /p/rubhew … /p/werewolf-moderator, /resume
   ↓
public/ copied verbatim (including the committed PDF)
   ↓
deployed to CDN
```

Every page is HTML on a CDN. The only JavaScript that ships is the highlight provider and the filter — a few kilobytes.

## Targets

- Landing page under 100 KB total, first paint under 1s on 3G
- Zero layout shift (CLS 0) — guaranteed by opacity-only interactions
- Every page readable with JavaScript disabled; filter and highlight are enhancements
- Lighthouse accessibility 100: real contrast, visible focus, keyboard parity
