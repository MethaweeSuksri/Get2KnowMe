// Colour records for domain and category ids. Imported by lib/css-tokens.ts
// (to emit --domain-*/--cat-* custom properties) and by lib/portfolio.ts
// (to fail the build when the data introduces an id with no colour here —
// otherwise the dot renders invisibly). No imports: this module must sit
// below both.

export const DOMAIN_COLORS: Record<string, string> = {
  backend: "oklch(0.55 0.11 250)",
  web: "oklch(0.55 0.11 155)",
  graphics: "oklch(0.6 0.15 40)",
  systems: "oklch(0.55 0.09 290)",
  mobile: "oklch(0.6 0.13 340)",
  gamedev: "oklch(0.62 0.13 90)",
  tooling: "oklch(0.55 0.09 200)",
};

export const CATEGORY_COLORS: Record<string, string> = {
  languages: "oklch(0.55 0.13 260)",
  "web-backend": "oklch(0.55 0.13 200)",
  graphics: "oklch(0.6 0.15 40)",
  "databases-cloud": "oklch(0.55 0.12 150)",
  "tools-systems": "oklch(0.55 0.1 300)",
  "cs-fundamentals": "oklch(0.55 0.11 20)",
  sdlc: "oklch(0.6 0.12 90)",
  leadership: "oklch(0.55 0.12 340)",
};
