"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { filterStore } from "./filterStore";

type Active = { kind: "skill" | "entity"; id: string } | null;

// The ONLY stateful piece of the highlight feature. It never re-renders cards
// or chips: hover/focus/pin set one attribute on this wrapper and the
// build-time CSS rules (lib/css-tokens.ts) do the rest.
export default function HighlightRoot({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Active>(null);
  const [pinned, setPinned] = useState(false);
  const filter = useSyncExternalStore(filterStore.subscribe, filterStore.get, () => "");

  // `undefined` = tooltip-only chip (no project evidence): leave dimming alone.
  const resolve = (target: EventTarget | null): Active | undefined => {
    if (!(target instanceof Element)) return null;
    const chip = target.closest("[data-skill]");
    if (chip) {
      if (chip.hasAttribute("data-tip")) return undefined;
      return { kind: "skill", id: chip.getAttribute("data-skill")! };
    }
    const entity = target.closest("[data-entity]");
    if (entity) return { kind: "entity", id: entity.getAttribute("data-entity")! };
    return null;
  };

  const hover = (target: EventTarget | null) => {
    if (pinned) return;
    const next = resolve(target);
    if (next !== undefined) setActive(next);
  };

  const clear = useCallback(() => {
    setPinned(false);
    setActive(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clear]);

  const onClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    // Click pins skill chips only; entity clicks are navigation.
    const chip = e.target.closest("[data-skill]");
    if (!chip || chip.hasAttribute("data-tip")) return;
    const id = chip.getAttribute("data-skill")!;
    if (pinned && active?.kind === "skill" && active.id === id) {
      clear();
      return;
    }
    setActive({ kind: "skill", id });
    setPinned(true);
    // On small screens tap-to-pin replaces hover: bring the projects into view.
    if (window.matchMedia("(max-width: 767px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document
        .getElementById("projects")
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
  };

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!pinned && !e.currentTarget.contains(e.relatedTarget)) setActive(null);
  };

  return (
    <div
      className="hl-root"
      data-active={active?.kind === "skill" ? active.id : undefined}
      data-active-e={active?.kind === "entity" ? active.id : undefined}
      data-filter={filter || undefined}
      onPointerOver={(e) => hover(e.target)}
      onPointerLeave={() => {
        if (!pinned) setActive(null);
      }}
      onFocus={(e) => hover(e.target)}
      onBlur={onBlur}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
