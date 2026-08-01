# B1 — IA & layout spec

Companion to `portfolio.json` and `PROJECT-BRIEF.md`. Decisions are stated, not offered. Push back on any of them.

---

## The constraint that determines the layout

Hovering a project highlights its skills; hovering a skill highlights its projects. For that to be usable, **projects and skills must be on screen simultaneously.** Everything below follows from this.

That rules out stacking skills below projects, and it rules out a skills page. It forces a two-column body with a sticky skills rail.

## Routes

| Route | Purpose |
|---|---|
| `/` | The recruiter surface. Everything they need, no engineering content. |
| `/p/<project-id>` | One static page per project. The only place `engineering` renders. |
| `/Methawee_Suksri_Resume.pdf` | Generated from the same data. |
| `/play` | Mini-game. Deferred; linked from the footer only. |

`/work` and `/projects` are cut. They showed subsets of what the landing page already shows — navigation that re-filters instead of informing.

## Desktop layout (1280–1440)

```
┌──────────────────────────────────────────────────────────────┐
│ Methawee Suksri                                       [↓ Résumé] │  sticky, 56px
├──────────────────────────────────────────────────────────────┤
│ IDENTITY BAND                                                 │
│ Methawee Suksri — Software Engineer (New Grad)                │
│ One-line summary                                              │
│ BSc Computer Science, Thammasat · First Class Honours · 3.75  │
│ Bangkok · Available now · email · LinkedIn · GitHub           │
├───────────────────────────────────┬──────────────────────────┤
│ EXPERIENCE                        │ SKILLS            sticky │
│  Yannix — SWE Intern    Jan–May 26│  Languages               │
│  · 3 highlights, chips            │   [Python][C/C++][JS]... │
│  RCP — IT Support / Dev  Jul–Dec25│  Web & Backend           │
│  · 3 highlights, chips            │   [Node][Express]...     │
│                                   │  Graphics                │
│ PROJECTS                          │   [OpenGL][Three.js]...  │
│  [Backend][Web][Graphics][…]      │  Databases               │
│  ┌──────────┐ ┌──────────┐        │  Tools & Systems         │
│  │ card     │ │ card     │        │  CS Fundamentals         │
│  └──────────┘ └──────────┘        │  Process                 │
│  ┌──────────┐ ┌──────────┐        │  Leadership              │
│  │ card     │ │ card     │        │                          │
│  └──────────┘ └──────────┘        │                          │
├───────────────────────────────────┴──────────────────────────┤
│ LEADERSHIP (compact, 2 lines)                                 │
└──────────────────────────────────────────────────────────────┘
```

**Grid:** 12 columns, 1200px max width, 24px gutters. Body splits **8 / 4** — main 66%, skills rail 33%. Rail is `position: sticky; top: 72px` so hover-linking survives scrolling.

**Project grid:** 2 columns inside the main column. 6 projects = 3 rows. Featured projects first.

**Fold budget at 1440×900:** identity band + both internships + the first project row are above the fold. That is the 40-second payload.

## Section order, and why

1. **Identity** — role target, degree, honours, GPAX, availability. Recruiters filter on these before reading anything else.
2. **Experience** — two real internships. Your strongest differentiator against other graduates, and the field recruiters weight highest.
3. **Projects** — volume and range, scannable as a grid.
4. **Skills** — right rail, parallel to 2 and 3, not sequential. It is a reference surface, not a reading surface.
5. **Leadership** — compact footer band. Real but secondary; it does not out-rank technical evidence for a SWE role.

Education is folded into the identity band rather than given a section. It is three facts, and a heading for three facts wastes the most valuable space on the page.

## Navigation

**No section links.** The page is short enough to scroll and anchor links would imply it isn't.

Sticky header carries exactly two things: your name (home link) and a **Résumé download button** — persistent because it is the single highest-value recruiter action, and it should never require scrolling to find.

Project pages replace the name with `← Back to overview`.

## Emphasis modes — cut

Removed. They were inherited from the original ChatGPT prompt, not a requirement of yours, and the domain filter does the same job better: it is user-driven rather than pre-set, and it is already URL-addressable.

Tailored links still work. `/?domain=graphics` opens the grid pre-filtered to the three graphics projects — send that with a graphics application. One mechanism instead of two.

Projects are ordered by a single `priority` weight. All six always render on the landing page; the filter narrows, it never hides work by default.

## Interaction

**Bidirectional highlight**

- Hover a project card → matching skill chips in the rail brighten; all others drop to 40% opacity.
- Hover a skill chip → project cards using it get a highlighted border; others drop to 40%.
- Hover a skill with no project evidence → shows its `contexts` line in a tooltip instead of dimming everything.

Rules: **no layout shift, ever** — opacity, colour, border only. 120ms ease. Fires immediately, no delay. `:focus-visible` behaves identically to hover, so it is fully keyboard-navigable. Click pins the highlight so you can read while it holds; Escape clears. `prefers-reduced-motion` removes the transition, keeps the effect.

**Domain filter**

Chips above the project grid: Backend, Web, Graphics, Systems, Mobile, Game Dev, Tooling. Multi-select, OR logic. Non-matching cards fade out and the grid reflows. Skills with no remaining project dim. Syncs to `?domain=graphics,backend`. A visible "Clear" appears when active.

## Card contents

**Project card (landing).** Title · tagline · team badge (`Solo` / `Lead · 5`) · year and course · up to 6 skill chips then `+N` · 2-line summary · `Technical detail →`.
Never architecture, decisions, or anything from `_prep`.

**Project page (`/p/<id>`).** Back link · title · tagline · team · year · repo link · media · summary · highlights · **Architecture** · **Decisions** as rows of *what / why / instead* with a monospace `ref` · skill chips linking back to `/?domain=…`.

## Mobile (< 768px)

Single column. Skills rail moves **below** projects — bidirectional hover cannot work on a small screen, so tap-to-pin a skill scrolls to and highlights matching projects instead. Filter chips become a horizontally scrolling row. Project grid goes 1-up.

## Type and density

Base 15px / 1.5. Prose capped at 70ch. Card titles 18px semibold, taglines 14px, chips 12px. Four spacing steps only: 4 / 8 / 16 / 32. One accent colour plus a neutral ramp; domain colours used **only** on filter chips and card domain dots, never as card backgrounds.

## Decided

1. **Light mode only.** Dark mode is deferred, not designed out — colours live in CSS custom properties so it can be added later without a rewrite.
2. **No photo of you.**
3. **Project media:** wireframe placeholders on `/p/<id>` only, never on the landing grid. A 16:9 grey block labelled with what will fill it, so the layout is already correct when real captures arrive.
4. **Emphasis modes cut entirely.** The domain filter replaces them.
5. **No phone number anywhere** — not on the site, not in the PDF. Email and LinkedIn only.


---

**Next: B2** — grayscale prototype of this, real content, working hover and filter, zero styling.
