# Portfolio site

Static portfolio + résumé PDF, both generated from one data file. Spec history
lives in `docs/` (`BUILD-PROMPT.md` is the authoritative spec; `B1-layout-spec.md`
is stale where it conflicts — the code is the truth).

## Stack

- Next.js App Router, TypeScript, React server components. Every page is
  statically generated.
- **Never enable `output: 'export'`** — `app/api/*` route handlers are planned
  for the mini-game (`app/play/`, deferred; when it ships, link it from the
  footer and restore "Get Creative" in the header).
- Plain CSS custom properties in `app/globals.css`. No Tailwind, no CSS-in-JS.
  Domain/category colours live in `lib/theme.ts`; `lib/css-tokens.ts` emits
  them plus the generated highlight/filter rules as the static `/tokens.css`
  route.

## The rules that matter

1. **`portfolio.public.json` is read at build time and never at runtime.**
   Import it in server components only (via `lib/portfolio.ts`, which is
   `server-only`). No `fetch()` of it, no embedding it in a `<script>`, nothing
   in `public/`. If a value reaches the browser, a component wrote it into the
   markup.
2. **Never hardcode a string that exists in the JSON.** Labels, taglines,
   summaries, URLs — all come from the data. UI chrome ("Highlights",
   "↓ Résumé") is the only hand-written copy.
3. **The layer boundary:** `project.engineering` renders on `/p/[id]` only.
   Landing-page components must never read it — not hidden with CSS, absent
   from the DOM. Keys beginning with `_` must never exist or render;
   validation enforces this.
4. **Validation fails the build loudly.** `lib/portfolio.ts` rejects unknown
   skill/domain/category ids, missing colour tokens, malformed dates
   (`YYYY-MM`; `null` endDate = "Present"), bad `repoUrl`s, and evidence-less
   skills without `contexts`. When adding data, run `npm run build` and read
   the error.

## Interaction model (do not React-ify)

Highlighting is pure CSS generated at build time. The client only sets
attributes: `HighlightRoot` sets `data-active`/`data-active-e` on its wrapper;
the domain filter sets `data-filter` on `<html>` (pre-hydration inline script
in `app/page.tsx` for deep links, `DomainFilter` afterwards; URL is the only
state). Opacity/colour/border only — zero layout shift is a hard requirement.
The skills rail must never inner-scroll; trim via `site.rail` in the JSON.

## Résumé workflow

Edit `portfolio.public.json` → `npm run resume` → commit the JSON, the PDF,
and `public/resume.stamp` together. The script builds, prints `/resume` via
Puppeteer (A4, one page enforced), and stamps a sha256 of the data;
`postbuild` fails on hash mismatch so a stale PDF cannot deploy. All fit knobs
(`maxHighlightsPer*`, `maxSkillsPer*`) live in `resume.rules` in the JSON.
Vercel skips the Chrome download (`vercel.json`); the PDF is a committed
artifact, never built in CI.
