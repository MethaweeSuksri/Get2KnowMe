import { contactLinks } from "@/lib/contacts";
import { education, formatRange, profile } from "@/lib/portfolio";

export default function IdentityBand() {
  const edu = education.find((e) => e.surface === "both" || e.surface === "web");

  return (
    <section className="identity" aria-label="Identity">
      <h1>{profile.fullName}</h1>
      <p className="role-line">{profile.targetRoles.join(" · ")}</p>
      <p className="summary">{profile.summary}</p>
      {edu && (
        <p className="edu-line">
          {edu.degree}, {edu.institution} · {edu.honors} · GPAX {edu.gpax} /{" "}
          {edu.gpaScale} · {formatRange(edu.startDate, edu.endDate)}
        </p>
      )}
      <div className="meta-line">
        <span>{profile.location.city}</span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>{profile.availability}</span>
        {contactLinks(["both", "web"]).map((c) => (
          <span key={c.key}>
            <span className="sep" aria-hidden="true">
              ·{" "}
            </span>
            <a href={c.href}>{c.text}</a>
          </span>
        ))}
      </div>
    </section>
  );
}
