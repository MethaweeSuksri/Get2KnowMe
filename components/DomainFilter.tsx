"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { filterStore } from "./filterStore";

export interface DomainOption {
  id: string;
  label: string;
}

// The URL is the state: read with useSearchParams, write with router.replace.
// Back button, reload, and shared links (/?domain=graphics) all work because
// component state is never the source of truth.
export default function DomainFilter({ domains }: { domains: DomainOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const known = new Set(domains.map((d) => d.id));
  const selected = (params.get("domain") ?? "")
    .split(",")
    .filter((id) => known.has(id));

  useEffect(() => {
    filterStore.set(selected.join(" "));
  });

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((d) => d !== id)
      : [...selected, id];
    router.replace(next.length ? `/?domain=${next.join(",")}` : "/", {
      scroll: false,
    });
  };

  return (
    <div className="filter-row">
      {domains.map((d) => (
        <button
          key={d.id}
          type="button"
          className="fchip"
          aria-pressed={selected.includes(d.id)}
          onClick={() => toggle(d.id)}
        >
          <span
            className="domain-dot"
            style={{ background: `var(--domain-${d.id})` }}
            aria-hidden="true"
          />
          {d.label}
        </button>
      ))}
      {selected.length > 0 && (
        <button
          type="button"
          className="fclear"
          onClick={() => router.replace("/", { scroll: false })}
        >
          Clear
        </button>
      )}
    </div>
  );
}

// Server-renderable stand-in with identical geometry, used as the Suspense
// fallback so the static HTML shows the chip row (no layout shift, readable
// without JavaScript).
export function DomainFilterStatic({ domains }: { domains: DomainOption[] }) {
  return (
    <div className="filter-row">
      {domains.map((d) => (
        <button key={d.id} type="button" className="fchip" aria-pressed={false}>
          <span
            className="domain-dot"
            style={{ background: `var(--domain-${d.id})` }}
            aria-hidden="true"
          />
          {d.label}
        </button>
      ))}
    </div>
  );
}
