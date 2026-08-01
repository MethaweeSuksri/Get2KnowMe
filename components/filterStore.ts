// Tiny client-side store bridging DomainFilter (which owns the URL) and
// HighlightRoot (which owns the data-filter attribute). The URL stays the
// single source of truth: DomainFilter mirrors ?domain= into this store, and
// HighlightRoot only reads it. This exists so HighlightRoot itself never calls
// useSearchParams — doing so would push the whole landing page behind a
// Suspense fallback in the static HTML.

type Listener = () => void;

let value = "";
const listeners = new Set<Listener>();

export const filterStore = {
  get: (): string => value,
  set(next: string): void {
    if (next === value) return;
    value = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
