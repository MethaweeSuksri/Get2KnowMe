// Emits the design tokens and the generated highlight/filter rules as CSS
// text. Every skill id is known at build time, so hover behaviour is pure CSS:
// the client only ever sets data-active / data-active-e / data-filter on one
// wrapper element. Order matters — filter rules come first so an active
// highlight (later, equal specificity) wins over a filter un-dim.
import "server-only";
import { domains, experiences, leadership, projects, skillById } from "./portfolio";

const TOKENS = `:root {
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
}`;

function filterRules(): string {
  const rules: string[] = [
    // A domain filter hides non-matching project cards and dims every chip;
    // per-domain rules below re-show / re-light the matches (OR logic).
    `[data-filter] .pcard { display: none }`,
    `[data-filter] .chip { opacity: 0.4 }`,
  ];
  for (const d of domains) {
    rules.push(
      `[data-filter~="${d.id}"] .pcard[data-domains~="${d.id}"] { display: flex }`,
      `[data-filter~="${d.id}"] .chip[data-chip-domains~="${d.id}"] { opacity: 1 }`,
    );
  }
  return rules.join("\n");
}

function skillRules(): string {
  const rules: string[] = [];
  for (const id of skillById.keys()) {
    rules.push(
      `[data-active="${id}"] .card:not([data-skills~="${id}"]) { opacity: 0.4 }`,
      `[data-active="${id}"] .chip:not([data-skill="${id}"]) { opacity: 0.4 }`,
      `[data-active="${id}"] .card[data-skills~="${id}"] { border-color: var(--accent) }`,
      `[data-active="${id}"] .chip[data-skill="${id}"] { opacity: 1; border-color: var(--accent); background: var(--accent-soft) }`,
    );
  }
  return rules.join("\n");
}

function entityRules(): string {
  const rules: string[] = [];
  const entityIds = [...projects, ...experiences, ...leadership].map((e) => e.id);
  for (const id of entityIds) {
    rules.push(
      `[data-active-e="${id}"] .chip:not([data-evid~="${id}"]) { opacity: 0.4 }`,
      `[data-active-e="${id}"] .chip[data-evid~="${id}"] { opacity: 1; border-color: var(--accent); background: var(--accent-soft) }`,
      `[data-active-e="${id}"] .card[data-entity="${id}"] { border-color: var(--accent) }`,
    );
  }
  return rules.join("\n");
}

export function buildCss(): string {
  return [TOKENS, filterRules(), skillRules(), entityRules()].join("\n");
}
