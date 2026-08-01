import SkillChip from "./SkillChip";
import { forWeb, leadership, skillById } from "@/lib/portfolio";

export default function LeadershipBand() {
  return (
    <section className="leadership-band" aria-label="Leadership">
      <h2 className="section-title">Leadership</h2>
      {leadership.filter(forWeb).map((item) => (
        <article
          key={item.id}
          className="card"
          data-entity={item.id}
          data-skills={item.skills.join(" ")}
        >
          <div className="card-head">
            <h3 className="card-title">{item.title}</h3>
            <span className="card-meta">{item.context}</span>
          </div>
          <ul>
            {item.highlights.filter(forWeb).map((h) => (
              <li key={h.text}>{h.text}</li>
            ))}
          </ul>
          <div className="chip-row">
            {item.skills.map((id) => (
              <SkillChip key={id} skill={skillById.get(id)!} />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
