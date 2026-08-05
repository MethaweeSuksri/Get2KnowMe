# Codebase walkthrough

A guided read of this repository for someone who did not write it and does not
work on websites for a living. Every claim below was checked against the code
as of commit `eff584a`.

Two terms used throughout, defined once:

- **Build time** — when `npm run build` runs on a developer machine or on
  Vercel's servers. The code executes once, produces finished HTML/CSS files,
  and those files are what gets deployed.
- **Runtime** — when a visitor's browser has the page open. Only the small
  amount of JavaScript that was shipped to the browser runs then.

The single most important fact about this codebase: almost everything happens
at build time. The site a visitor sees is pre-baked HTML. The browser-side
JavaScript does exactly two small jobs (described in "Thing 2" below).

---

## The one-paragraph version

One JSON file, `portfolio.public.json`, holds every fact about the person —
profile, skills, projects, work experience, leadership, plus configuration.
At build time, `lib/portfolio.ts` reads it, refuses to build if anything is
malformed, and turns it into lookup tables. React components read those
tables and emit three surfaces: a landing page for recruiters (`/`), a
per-project detail page for engineers (`/p/<id>`), and a printable résumé
page (`/resume`) that a script turns into the committed PDF. Nothing is
written twice: change the JSON, rebuild, and the site, the project pages,
and the résumé all update.

---

## File-by-file: what exists and why

### The data

| File | What it is |
|---|---|
| `portfolio.public.json` | The single source of truth. ~1,450 lines: `meta`, `profile`, `domains` (7 topic areas like "backend", "graphics"), `skillCategories` (8), `skills` (73), `education`, `experience` (2), `projects` (6), `leadership` (1), `resume` (config + fit rules for the PDF), `site` (config for the web pages). Every piece of visible text on the site comes from here except UI chrome like the word "Highlights". |
| `portfolio-build-kit/` | Reference material, not part of the build: a copy of the JSON and `Resume.reference.html`, the hand-made résumé design the `/resume` page was ported from. Nothing imports from this directory. |

Two schema conventions worth knowing:

- Every skill, project, experience, and leadership entry has a `surface`
  field: `"web"`, `"resume"`, or `"both"`. It controls which output the item
  appears in. That is how one file can feed both a website and a one-page
  résumé without duplicating content.
- Projects have an `engineering` block (architecture prose plus a list of
  what/why/instead-of decisions). It is deliberately shown only on the
  per-project pages, never on the landing page — see "the layer boundary"
  under Thing 1.

### The library (`lib/`) — build-time logic, no visuals

| File | What it does |
|---|---|
| `lib/types.ts` | TypeScript type definitions mirroring the JSON's schema (version 3.1.0). Pure declarations; no behaviour. Read it as an annotated map of the JSON. |
| `lib/portfolio.ts` | The heart of the repo. Imports the JSON, **validates it** (see Thing 3's sibling: validation), then exports the data as sorted lists and lookup tables (`Map`s): skills by id, projects by skill, skills by category, entities (projects/experience/leadership) by skill, domains by skill. Also exports small formatting helpers (`"2026-01"` → `"Jan 2026"`, team-size badges) and `buildResumeModel()`, which applies the `resume.rules` caps from the JSON to produce exactly what fits on one page. The first line, `import "server-only"`, makes the build fail if any browser-side code ever tries to import this file — that is how rule "JSON never reaches the browser" is enforced mechanically, not just by convention. |
| `lib/theme.ts` | Two colour tables: one colour per domain id, one per skill-category id. Kept separate (and import-free) because both `portfolio.ts` and `css-tokens.ts` need it: the former fails the build if a domain in the JSON has no colour here; the latter turns the colours into CSS variables. |
| `lib/css-tokens.ts` | Generates CSS *text* at build time: the colour variables, plus one rule per skill id, per entity id, and per domain id that implement all hover-highlighting and filtering (see Thing 2). This is why the site can highlight relationships across the page with no JavaScript doing any matching. |
| `lib/contacts.ts` | Turns `profile.contact` from the JSON into displayable links for the header/footer/identity band. One shared function so an unknown contact key degrades to a sensible fallback (its hostname) everywhere, instead of each component inventing its own. |

### The pages (`app/`) — one folder per URL

Next.js (the framework) maps folders under `app/` to URLs.

| File | URL | What it does |
|---|---|---|
| `app/layout.tsx` | wraps every page | The outer HTML shell. Sets the browser-tab title from the profile, loads `globals.css`, and links the generated `/tokens.css` stylesheet. |
| `app/page.tsx` | `/` | The landing page — the recruiter surface. Assembles the components below. Also contains a five-line inline script that runs before the page first paints: if the URL is a shared filter link like `/?domain=graphics`, it sets the filter attribute immediately so the page opens already filtered, with no flash of the unfiltered grid. |
| `app/p/[id]/page.tsx` | `/p/<project-id>` | The per-project detail page — the engineer surface, and the only place a project's `engineering` block renders. `generateStaticParams` tells the build to pre-render one page per web-surface project; `dynamicParams = false` means unknown ids are a 404 decided at build time, not looked up on a server. Each skill chip here links back to the landing page pre-filtered to that skill's domains. |
| `app/resume/page.tsx` | `/resume` | The résumé as a web page: single column, plain text, system fonts, no icons — a shape chosen because automated résumé scanners (ATS) misread multi-column layouts and tables. Renders `buildResumeModel()`. Exists only to be printed to PDF; it is marked `robots: noindex` so search engines skip it. |
| `app/tokens.css/route.ts` | `/tokens.css` | Serves the CSS text from `lib/css-tokens.ts` as a stylesheet. `dynamic = "force-static"` makes it a file generated once at build time, not code that runs per request. |
| `app/globals.css` | — | All hand-written styling (~750 lines): layout, cards, chips, the skills rail, the domain-filter row, the résumé document styles, print rules. Colours are *not* here — they come from `/tokens.css` as CSS variables. |

### The components (`components/`) — reusable page pieces

All of these run at build time and emit static HTML, except the two marked
**client** (those also ship JavaScript to the browser).

| File | What it does |
|---|---|
| `Header.tsx` | Sticky top bar: the person's name (or "← Back to overview" on project pages) and the "↓ Résumé" download button, which points at the committed PDF. A comment notes a planned "Get Creative" link, held back until the deferred mini-game exists. |
| `Footer.tsx` | Name, location, contact links (via `lib/contacts.ts`). |
| `IdentityBand.tsx` | The block at the top of the landing page: name, target roles, summary, education line, location/availability/contact line. |
| `ExperienceList.tsx` | Work-experience cards: company, role, date range, highlight bullets, up to 6 skill chips (then "+N"). |
| `ProjectGrid.tsx` / `ProjectCard.tsx` | The project cards. Each card carries three invisible attributes — its own id, its skill ids, its domain ids — which are what the generated CSS matches against (Thing 2). A card shows title, tagline, team badge, chips, a clamped summary, and a "Technical detail →" link. Deliberately never reads `engineering` or `media`. |
| `LeadershipBand.tsx` | Leadership cards, same pattern as experience. |
| `SkillsRail.tsx` | The right-hand skills column, grouped by category. Its hard rule: it must never grow a scrollbar of its own. If it gets too tall, content is trimmed via `site.rail` in the JSON (omit skills that have no project evidence; exclude whole categories) — a data-level fix, not a CSS one. |
| `SkillChip.tsx` | Every skill pill on the site. Its job is to stamp data attributes onto the HTML: which skill this is, which entities cite it (`data-evid`), which domains its projects belong to (`data-chip-domains`). A skill with no project evidence but a `contexts` list instead gets a tooltip (`data-tip`) rather than participating in highlighting — hovering it would otherwise dim the whole page with nothing lit. |
| `HighlightRoot.tsx` | **Client.** The only stateful piece of the highlight feature. Wraps the main landing-page content and listens for hover, focus, click, and Escape. All it ever does is set (or clear) one attribute on its own wrapper: `data-active="<skill-id>"` or `data-active-e="<entity-id>"`. Clicking a chip pins the highlight; on phones a tap also scrolls the project grid into view. It never re-renders cards or computes matches — the CSS does that. |
| `DomainFilter.tsx` | **Client.** The row of domain toggle buttons above the project grid. The URL is the only state: toggling a domain rewrites the address to `/?domain=web,graphics`, and the component copies that value onto a `data-filter` attribute on the `<html>` element. Because state lives in the URL, the back button, reload, and shared links all work for free. A second export, `DomainFilterStatic`, is a JavaScript-free look-alike shown until the interactive one loads, so the page never shifts and reads fine without JavaScript. |

### The résumé pipeline (`scripts/`)

| File | What it does |
|---|---|
| `scripts/make-resume.mjs` | Run manually as `npm run resume`. Builds the site, starts it on a local port (refusing to run if the port is already taken — printing a stale build would be worse than an error), opens `/resume` in a headless Chrome via Puppeteer, and prints it to `public/<resume.fileName>` as A4. It then counts the pages inside the PDF and fails if over `resume.pageLimit` (1), and writes `public/resume.stamp` — a sha256 hash of `portfolio.public.json` recording exactly which data the PDF was generated from. |
| `scripts/check-resume.mjs` | Runs automatically after every build (`postbuild` in `package.json`). Recomputes the hash of the current JSON and compares it to the stamp. Mismatch or missing PDF → the build fails with instructions to run `npm run resume`. This is Thing 3. |

### Configuration and housekeeping

| File | What it does |
|---|---|
| `package.json` | Scripts (`dev`, `build` + `postbuild`, `resume`, `lint`) and dependencies. Note how small the dependency list is: Next.js, React, `server-only`, and (dev-only) Puppeteer, ESLint, TypeScript. |
| `vercel.json` | One setting: skip downloading Chrome on the deployment servers. The PDF is a committed artifact, never rebuilt in CI — deploys only need to *verify* it (hash check), not regenerate it. |
| `next.config.ts` | Empty on purpose. In particular `output: 'export'` is never enabled, keeping the door open for the deferred mini-game's server routes (`app/play/`, `app/api/*`). |
| `tsconfig.json`, `eslint.config.mjs`, `next-env.d.ts` | Standard TypeScript/linting setup; the only project-specific bit is the `@/` import alias for the repo root. |
| `public/` | Files served as-is: the committed résumé PDF and its stamp. Deliberately nothing else — putting the JSON here would publish it. |
| `docs/` | Spec history. `BUILD-PROMPT.md` is the authoritative spec; `B1-layout-spec.md` and `ARCHITECTURE.md` are earlier drafts, stale where they conflict with the code. |
| `CLAUDE.md` | The condensed rulebook for anyone (or any tool) editing the repo. Worth reading in full; this walkthrough expands on it. |

---

## Suggested reading order

1. **`portfolio.public.json`** — skim, don't read. Look at one project entry
   end to end (including `engineering` and `surface`), one skill with
   `contexts`, and the `resume.rules` and `site.rail` blocks. Everything else
   in the repo exists to render this file.
2. **`lib/types.ts`** — the JSON's shape, with comments.
3. **`lib/portfolio.ts`** — validation first (what the build refuses), then
   the exported lookup tables. The comment "The inversion below IS the
   bidirectional hover feature" marks the pivotal line.
4. **`app/page.tsx`** — see how the landing page is assembled, then dip into
   each component it uses, in the order they appear: `Header`,
   `IdentityBand`, `HighlightRoot`, `ExperienceList`, `DomainFilter`,
   `ProjectGrid`/`ProjectCard`, `SkillsRail`/`SkillChip`, `LeadershipBand`,
   `Footer`.
5. **The highlight machinery as a unit** — `SkillChip.tsx` (writes the
   attributes), `lib/theme.ts` → `lib/css-tokens.ts` →
   `app/tokens.css/route.ts` (generate the rules), `HighlightRoot.tsx` and
   `DomainFilter.tsx` (flip the switches). This is Thing 2; read these five
   together or none of them will quite make sense.
6. **`app/p/[id]/page.tsx`** and **`app/resume/page.tsx`** — the other two
   surfaces.
7. **`scripts/make-resume.mjs`** and **`scripts/check-resume.mjs`** — the PDF
   pipeline and its guard.
8. `app/globals.css` last, and only as needed — it is styling detail, and the
   comments at `.rail` and the chip/tooltip rules are the only load-bearing
   parts.

---

## Where the data flows

Everything fans out from the JSON, entirely at build time:

```
portfolio.public.json
        │
        ▼
lib/portfolio.ts  ──── validates, indexes, sorts ────┐
        │                                            │
        ├──▶ app/layout.tsx        (page title)      │
        ├──▶ app/page.tsx tree     (landing HTML)    │
        ├──▶ app/p/[id]/page.tsx   (project HTML,    │
        │         incl. engineering — only here)     │
        ├──▶ buildResumeModel() ──▶ app/resume/page.tsx
        │                                │
        │              npm run resume:   ▼
        │              Puppeteer prints /resume
        │                                │
        │                                ▼
        │              public/<name>.pdf + public/resume.stamp
        │                                │
        │              every build:      ▼
        │              scripts/check-resume.mjs (hash must match)
        │
        └──▶ lib/css-tokens.ts ──▶ /tokens.css  (colours + all
                  ▲                  highlight/filter CSS rules)
             lib/theme.ts
```

At runtime, in the visitor's browser, only two things ever change, and both
are single HTML attributes:

```
hover/click a chip or card ──▶ HighlightRoot sets data-active / data-active-e
toggle a domain button     ──▶ URL changes ──▶ DomainFilter sets data-filter on <html>
```

The pre-generated CSS in `/tokens.css` reacts to those attributes; no other
JavaScript runs.

---

## The three things worth understanding deeply

### Thing 1 — the JSON stops at the build; the browser only ever gets HTML

The rule (`CLAUDE.md` rule 1) is: `portfolio.public.json` is read at build
time and never at runtime. If a value appears in the browser, it is because a
component wrote it into the markup.

Why it matters: the JSON is a superset of what any one page should show. The
`engineering` blocks are meant for engineers reading a project page, not for
the landing-page scan; a future private field must not leak just because it
exists. With a "fetch the JSON in the browser" design, the whole file ships
to every visitor and privacy becomes a matter of hoping no component displays
the wrong field. With this design, the file physically is not in the output —
only the strings that components explicitly rendered are.

How it is enforced, in three layers:

1. `lib/portfolio.ts` starts with `import "server-only"`, a marker package
   that makes the build *fail* if browser-side code imports it. The two
   client components (`HighlightRoot`, `DomainFilter`) provably touch no
   data: one receives children to wrap, the other a plain list of
   `{id, label}` pairs passed in as props.
2. The layer boundary: `engineering` is read only in `app/p/[id]/page.tsx`.
   Landing-page components never read it — it is not hidden with CSS, it is
   absent from that page's HTML entirely.
3. Validation rejects any key beginning with `_` anywhere in the JSON
   (`scanForPrivateKeys`), so a "private note to self" field cannot even
   exist in the public file, let alone render.

A related sub-rule with the same spirit: validation fails the build loudly on
unknown skill/domain/category ids, malformed dates, bad repo URLs, missing
colour tokens, and skills with neither evidence nor `contexts`. The comment
in `portfolio.ts` states the philosophy: "A silently missing chip is
invisible; a red build is not." When editing the data, the workflow is: edit,
`npm run build`, read the error.

### Thing 2 — interactivity without an interactive framework

Hover a skill chip and every project card that doesn't use that skill dims;
hover a project card and every chip it cites lights up; toggle a domain and
non-matching cards disappear. This looks like classic React state — a
component tracking "what's hovered" and re-rendering cards. It is not, and
the difference is the most distinctive design decision in the repo.

The trick has three parts:

1. **Relationships are stamped into the HTML at build time.** Every card
   carries `data-skills="git docker …"` and `data-domains="backend web"`;
   every chip carries `data-skill`, `data-evid` (the ids of entities citing
   it), and `data-chip-domains`. These come from the lookup tables in
   `lib/portfolio.ts` — notably `projectsBySkill`, the inversion of each
   project's skill list.
2. **The matching logic is compiled to CSS.** `lib/css-tokens.ts` loops over
   every known skill, entity, and domain id and writes rules like: *when the
   wrapper says `data-active="git"`, any card whose `data-skills` does not
   contain `git` gets opacity 0.4, and the matching chips get an accent
   border.* Seventy-three skills' worth of rules, generated once per build,
   served as the static `/tokens.css`.
3. **The browser JavaScript only flips switches.** `HighlightRoot` sets one
   attribute on one wrapper element; `DomainFilter` mirrors the URL onto one
   attribute on `<html>`. Neither ever touches a card.

Why bother: with no per-card re-rendering there is nothing to get slow and no
moment where the page is half-updated; the effects are restricted to opacity,
colour, and border, so **zero layout shift** — nothing moves, ever — is a
property of the mechanism rather than a discipline; the page works before the
JavaScript loads; and a filtered view is just a URL, so it can be shared (the
inline script in `app/page.tsx` makes such links render filtered even before
the JavaScript wakes up). The cost is that the CSS file grows with the data
and the generated rules need careful ordering (filter rules first, so an
active highlight wins over a filter un-dim — the comment at the top of
`css-tokens.ts` says exactly this). `CLAUDE.md` calls this "do not
React-ify": adding conventional state here would be a regression.

Edge cases that make the design legible once you see them: chips inside an
already-dimmed card are clamped back to opacity 1 so dimming doesn't compound
(0.4 × 0.4); experience-card chips are exempt from the domain filter's dim
because the filter narrows *projects* only; and evidence-less skills become
tooltips instead of highlighters.

### Thing 3 — the résumé PDF cannot silently go stale

The résumé is a *committed file*, not something the deployment builds. The
deployment servers never run Chrome (`vercel.json` skips the download); they
serve whatever PDF was last committed. That creates an obvious failure mode:
edit the JSON, forget to regenerate, deploy — the site says one thing and the
downloadable résumé another, which for a portfolio is the worst kind of bug
because no error ever appears and a recruiter is the one who finds it.

The pipeline closes that hole with a content hash:

1. `npm run resume` (`scripts/make-resume.mjs`) builds the site, serves it
   locally, prints `/resume` to PDF with a headless Chrome, and **refuses to
   finish** if the PDF exceeds one page (it counts page objects inside the
   PDF file itself). It then writes `public/resume.stamp`: the sha256 hash of
   the exact `portfolio.public.json` the PDF was generated from.
2. Every `npm run build` triggers `postbuild` → `scripts/check-resume.mjs`,
   which recomputes the hash of the current JSON and compares. Any
   difference — even a whitespace change — fails the build with the fix in
   the error message. Vercel runs the same build, so a stale PDF cannot
   reach production.

A hash is used instead of file timestamps because CI builds start from a
fresh `git clone`, where every file's timestamp is "just now" — mtimes carry
no information there, content does. The check deliberately over-triggers
(a JSON change that doesn't affect the résumé still demands regeneration);
the comment in `check-resume.mjs` accepts this: the rule stays simple —
"change the data, regenerate the PDF."

The one-page fitting itself is also data-driven: `buildResumeModel()` in
`lib/portfolio.ts` applies caps from `resume.rules` in the JSON
(`maxProjects`, `maxHighlightsPerProject`, `maxSkillsPerCategoryLine`, a
priority floor). When the PDF overflows, the fix is to tighten those numbers
in the JSON — the code never needs editing to make the résumé fit.

---

## What is deliberately absent

Knowing what was left out prevents "helpful" additions that break the design:

- **No Tailwind, no CSS-in-JS** — plain CSS with custom properties.
- **No client-side data fetching** of any kind; no runtime server logic
  (every route, including `/tokens.css`, is forced static).
- **No React state for highlighting or filtering** (Thing 2).
- **No `output: 'export'`** in `next.config.ts`, despite the site being fully
  static today — it would forbid the server routes the planned mini-game
  (`app/play/`, currently deferred) will need.
- **No PDF generation in CI** — the PDF is committed, CI only verifies it.
- **No phone number anywhere** — a spec decision; the résumé reference HTML
  had one and the port removed it.
