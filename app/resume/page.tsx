import type { Metadata } from "next";
import {
  buildResumeModel,
  education,
  formatRange,
  profile,
  teamBadge,
} from "@/lib/portfolio";

export const metadata: Metadata = {
  title: `Résumé — ${profile.fullName}`,
  robots: { index: false },
};

const stripUrl = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\.git$/, "");

// Ported from Resume.reference.html, rebuilt to read from the JSON. Single-
// column document flow, real text, system fonts, no icons or images — ATS
// parsers read across gutters, so no CSS columns and no tables. The reference
// HTML carried a phone number; the spec forbids one anywhere, so it is gone.
export default function ResumePage() {
  const model = buildResumeModel();
  const edu = education.find((e) => e.surface === "both" || e.surface === "resume");
  const contact = profile.contact;
  const links = [contact.linkedin, contact.github, contact.githubUniversity].filter(
    (c) => c?.value && (c.surface === "both" || c.surface === "resume"),
  );

  return (
    <main className="resume-doc">
      <div style={{ marginBottom: 6 }}>
        <h1 className="res-name">{profile.fullName}</h1>
        <div className="res-contact">
          {profile.location.city}, {profile.location.country} · {profile.availability}
        </div>
        <div className="res-contact">
          {contact.email.value}
          <br />
          {links.map((c, i) => (
            <span key={c.value}>
              {i > 0 && " · "}
              <a className="res-link" href={c.value!}>
                {stripUrl(c.value!)}
              </a>
            </span>
          ))}
        </div>
      </div>

      <p className="res-summary">{profile.summary}</p>

      {edu && (
        <section className="res-section">
          <h2 className="res-h2">Education</h2>
          <div className="res-row">
            <span className="res-title">
              {edu.degree}, {edu.institution}
            </span>
            <span className="res-meta">{formatRange(edu.startDate, edu.endDate)}</span>
          </div>
          <div className="res-meta">
            {edu.honors} · GPAX {edu.gpax} / {edu.gpaScale.toFixed(1)}
          </div>
        </section>
      )}

      <section className="res-section">
        <h2 className="res-h2">Experience</h2>
        {model.experiences.map((exp) => (
          <div className="res-item" key={exp.id}>
            <div className="res-row">
              <span className="res-title">
                {exp.company} — {exp.role}
              </span>
              <span className="res-meta">{formatRange(exp.startDate, exp.endDate)}</span>
            </div>
            <ul className="res-list">
              {exp.resumeHighlights.map((h) => (
                <li key={h.text}>{h.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="res-section">
        <h2 className="res-h2">Projects</h2>
        {model.projects.map((project) => (
          <div className="res-item" key={project.id}>
            <div className="res-row">
              <span className="res-title">
                {project.title} — {project.tagline}
              </span>
              <span className="res-meta">{project.year}</span>
            </div>
            <div className="res-meta">
              {project.context} · {teamBadge(project.team)} ·{" "}
              {stripUrl(project.repoUrl)}
            </div>
            <ul className="res-list">
              {project.resumeHighlights.map((h) => (
                <li key={h.text}>{h.text}</li>
              ))}
            </ul>
            <div className="res-skill-line">{project.techLine}</div>
          </div>
        ))}
      </section>

      <section className="res-section">
        <h2 className="res-h2">Skills</h2>
        {model.skillLines.map((line) => (
          <div className="res-skill-line" key={line.category}>
            <strong>{line.category}:</strong> {line.labels.join(", ")}
          </div>
        ))}
      </section>

      <section className="res-section" style={{ marginBottom: 3 }}>
        <h2 className="res-h2">Leadership</h2>
        {model.leadership.map((item) => (
          <div key={item.id}>
            <span className="res-title">{item.title}</span> —{" "}
            {item.highlights
              .filter((h) => h.surface === "both" || h.surface === "resume")
              .slice(0, 1)
              .map((h) => h.text)
              .join(" ")}
          </div>
        ))}
      </section>
    </main>
  );
}
