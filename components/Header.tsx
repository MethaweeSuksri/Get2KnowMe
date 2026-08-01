import Link from "next/link";
import { profile, resumeConfig } from "@/lib/portfolio";

// Project pages replace the name with a back link (B1 spec, Navigation).
export default function Header({ back = false }: { back?: boolean }) {
  return (
    <header className="site-header">
      <div className="shell">
        {back ? (
          <Link className="quiet-link" href="/">
            ← Back to overview
          </Link>
        ) : (
          <Link className="brand" href="/">
            {profile.fullName}
          </Link>
        )}
        <nav className="header-nav" aria-label="Site">
          {/* "Get Creative" returns here once /play exists — a dead link in
              the sticky header is worse than no link. */}
          <a className="btn-filled" href={`/${resumeConfig.fileName}`} download>
            ↓ Résumé
          </a>
        </nav>
      </div>
    </header>
  );
}
