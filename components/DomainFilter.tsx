"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface DomainOption {
  id: string;
  label: string;
}

// The URL is the state: read with useSearchParams, write with router.replace.
// Back button, reload, and shared links (/?domain=graphics) all work because
// component state is never the source of truth. The filter's effect on the
// page is the data-filter attribute on <html>: an inline pre-hydration script
// in app/page.tsx sets it before first paint so deep links open filtered, and
// this component keeps it in sync afterwards.
export default function DomainFilter({ domains }: { domains: DomainOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const known = new Set(domains.map((d) => d.id));
  const selected = (params.get("domain") ?? "")
    .split(",")
    .filter((id) => known.has(id));
  const filterValue = selected.join(" ");

  useEffect(() => {
    if (filterValue) {
      document.documentElement.setAttribute("data-filter", filterValue);
    } else {
      document.documentElement.removeAttribute("data-filter");
    }
  }, [filterValue]);

  // Client-side navigation away from the landing page must not leave the
  // project-page chips dimmed by a stale filter attribute.
  useEffect(() => {
    return () => document.documentElement.removeAttribute("data-filter");
  }, []);

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
