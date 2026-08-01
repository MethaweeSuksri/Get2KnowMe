// Emits the design tokens and the generated highlight/filter rules as CSS
// text. Every skill id is known at build time, so hover behaviour is pure CSS:
// the client only ever sets data-active / data-active-e on one wrapper and
// data-filter on <html>. Order matters — filter rules come first so an active
// highlight (later, equal specificity) wins over a filter un-dim.
import "server-only";
import { domains, experiences, leadership, projects, skillById } from "./portfolio";
import { CATEGORY_COLORS, DOMAIN_COLORS } from "./theme";

function tokens(): string {
  const lines = [
    "  --bg:            oklch(1 0 0);",
    "  --surface:       oklch(0.98 0 0);",
    "  --text:          oklch(0.18 0 0);",
    "  --text-muted:    oklch(0.46 0 0);",
    "  --border:        oklch(0.88 0 0);",
    "  --border-strong: oklch(0.7 0 0);",
    "  --accent:        oklch(0.5 0.14 250);",
    "  --accent-soft:   oklch(0.95 0.03 250);",
    ...Object.entries(DOMAIN_COLORS).map(([id, c]) => `  --domain-${id}: ${c};`),
    ...Object.entries(CATEGORY_COLORS).map(([id, c]) => `  --cat-${id}: ${c};`),
  ];
  return `:root {\n${lines.join("\n")}\n}`;
}

function filterRules(): string {
  const rules: string[] = [
    // A domain filter hides non-matching project cards and dims chips;
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
  // The filter narrows projects; the experience cards are not being filtered,
  // so their chips must not read as disabled while it is active.
  rules.push(`[data-filter] .exp-list .chip { opacity: 1 }`);
  return rules.join("\n");
}

function skillRules(): string {
  const rules: string[] = [];
  for (const id of skillById.keys()) {
    rules.push(
      `[data-active="${id}"] .card:not([data-skills~="${id}"]) { opacity: 0.4 }`,
      `[data-active="${id}"] .chip:not([data-skill="${id}"]) { opacity: 0.4 }`,
      // Chips inside an already-dimmed card would otherwise compound to
      // 0.4 × 0.4 = 0.16 — clamp them so the card's dim is the only one.
      `[data-active="${id}"] .card:not([data-skills~="${id}"]) .chip { opacity: 1 }`,
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
  return [tokens(), filterRules(), skillRules(), entityRules()].join("\n");
}
