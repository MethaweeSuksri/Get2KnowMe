import { education, formatRange, profile } from "@/lib/portfolio";

const CONTACT_TEXT: Record<string, (value: string, label?: string) => string> = {
  email: (value) => value,
  linkedin: (_, label) => label ?? "LinkedIn",
  github: (_, label) => `GitHub (${label ?? "GitHub"})`,
  githubUniversity: (_, label) => `GitHub (${label ?? "GitHub"})`,
};

export default function IdentityBand() {
  const edu = education.find((e) => e.surface === "both" || e.surface === "web");
  const contacts = Object.entries(profile.contact).filter(
    ([, c]) => c.value !== null && (c.surface === "both" || c.surface === "web"),
  );

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
        {contacts.map(([key, c]) => {
          const text = CONTACT_TEXT[key]?.(c.value!, c.label) ?? key;
          const href = key === "email" ? `mailto:${c.value}` : c.value!;
          return (
            <span key={key}>
              <span className="sep" aria-hidden="true">
                ·{" "}
              </span>
              <a href={href}>{text}</a>
            </span>
          );
        })}
      </div>
    </section>
  );
}
