import Link from "next/link";
import SkillChip from "./SkillChip";
import { skillById, teamBadge } from "@/lib/portfolio";
import type { Project } from "@/lib/types";

const MAX_CHIPS = 6;

// Landing-page card. Reads only scan-layer fields — never `engineering`,
// never `media`; that content is absent from this DOM by design.
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      className="card pcard"
      data-entity={project.id}
      data-skills={project.skills.join(" ")}
      data-domains={project.domains.join(" ")}
    >
      <div className="card-head">
        <h3 className="card-title">
          {project.repoUrl ? (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              {project.title}
            </a>
          ) : (
            <Link href={`/p/${project.id}`}>{project.title}</Link>
          )}
        </h3>
        <span className="domain-dots" aria-hidden="true">
          {project.domains.map((d) => (
            <span
              key={d}
              className="domain-dot"
              style={{ background: `var(--domain-${d})` }}
            />
          ))}
        </span>
      </div>
      <p className="tagline">{project.tagline}</p>
      <div className="badge-row">
        <span className="badge">{teamBadge(project.team)}</span>
        <span className="card-meta">
          {project.context} · {project.year}
        </span>
      </div>
      <div className="chip-row">
        {project.skills.slice(0, MAX_CHIPS).map((id) => (
          <SkillChip key={id} skill={skillById.get(id)!} />
        ))}
        {project.skills.length > MAX_CHIPS && (
          <span className="chip-more">+{project.skills.length - MAX_CHIPS}</span>
        )}
      </div>
      <p className="clamp3">{project.summary}</p>
      <p className="detail-link">
        <Link href={`/p/${project.id}`}>Technical detail →</Link>
      </p>
    </article>
  );
}
