import { profile } from "@/lib/portfolio";

export default function Footer() {
  const contacts = Object.entries(profile.contact).filter(
    ([, c]) => c.value !== null && (c.surface === "both" || c.surface === "web"),
  );
  return (
    <footer className="site-footer">
      <div className="shell">
        <span>
          {profile.fullName} · {profile.location.city}, {profile.location.country}
        </span>
        <nav className="footer-links" aria-label="Contact">
          {contacts.map(([key, c]) => (
            <a key={key} href={key === "email" ? `mailto:${c.value}` : c.value!}>
              {key === "email" ? c.value : c.label ? `GitHub (${c.label})` : "LinkedIn"}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
