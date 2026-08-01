import type { Metadata } from "next";
import "./globals.css";
import { profile } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: `${profile.fullName} — ${profile.targetRoles[0]}`,
  description: profile.summary,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Design tokens + build-time-generated highlight/filter rules,
            emitted by lib/css-tokens.ts and served as a static stylesheet.
            React hoists this link into <head>. The lint rule assumes a
            hand-maintained file; this one is generated per build. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/tokens.css" precedence="default" />
        {children}
      </body>
    </html>
  );
}
