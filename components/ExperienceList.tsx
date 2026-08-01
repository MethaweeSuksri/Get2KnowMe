import SkillChip from "./SkillChip";
import { experiences, formatRange, forWeb, skillById } from "@/lib/portfolio";

const MAX_CHIPS = 6;

export default function ExperienceList() {
  return (
    <div className="exp-list">
      {experiences.filter(forWeb).map((exp) => (
        <article
          key={exp.id}
          className="card"
          data-entity={exp.id}
          data-skills={exp.skills.join(" ")}
        >
          <div className="card-head">
            <h3 className="card-title">
              {exp.company} — {exp.role}
            </h3>
            <span className="card-meta">{formatRange(exp.startDate, exp.endDate)}</span>
          </div>
          <p className="card-sub">{exp.summary}</p>
          <ul>
            {exp.highlights.filter(forWeb).map((h) => (
              <li key={h.text}>{h.text}</li>
            ))}
          </ul>
          <div className="chip-row">
            {exp.skills.slice(0, MAX_CHIPS).map((id) => (
              <SkillChip key={id} skill={skillById.get(id)!} />
            ))}
            {exp.skills.length > MAX_CHIPS && (
              <span className="chip-more">+{exp.skills.length - MAX_CHIPS}</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
