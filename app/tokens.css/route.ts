import { buildCss } from "@/lib/css-tokens";

// Serves the design tokens + generated highlight/filter rules as a static,
// cacheable stylesheet. Generated once at build time — this is a prerendered
// route, not a runtime server.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildCss(), {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
