// One derivation of contact links for the site header/footer surfaces, so an
// unknown key added to profile.contact degrades to something honest (its
// hostname) everywhere instead of each component inventing a fallback.
import "server-only";
import { profile } from "./portfolio";
import type { Surface } from "./types";

export interface ContactLink {
  key: string;
  href: string;
  text: string;
}

const KNOWN_TEXT: Record<string, (value: string, label?: string) => string> = {
  email: (value) => value,
  linkedin: () => "LinkedIn",
  github: (_, label) => `GitHub (${label ?? "Personal"})`,
  githubUniversity: (_, label) => `GitHub (${label ?? "University"})`,
};

function fallbackText(value: string, label?: string): string {
  if (label) return label;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function contactLinks(surfaces: Surface[]): ContactLink[] {
  return Object.entries(profile.contact)
    .filter(([, c]) => c.value !== null && surfaces.includes(c.surface))
    .map(([key, c]) => ({
      key,
      href: key === "email" ? `mailto:${c.value}` : c.value!,
      text: KNOWN_TEXT[key]?.(c.value!, c.label) ?? fallbackText(c.value!, c.label),
    }));
}
