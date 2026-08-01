import { contactLinks } from "@/lib/contacts";
import { profile } from "@/lib/portfolio";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <span>
          {profile.fullName} · {profile.location.city}, {profile.location.country}
        </span>
        <nav className="footer-links" aria-label="Contact">
          {contactLinks(["both", "web"]).map((c) => (
            <a key={c.key} href={c.href}>
              {c.text}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
