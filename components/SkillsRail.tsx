import SkillChip from "./SkillChip";
import { forWeb, skillCategories, skillsByCategory } from "@/lib/portfolio";

// The rail always uses the full label, never shortLabel.
export default function SkillsRail() {
  return (
    <aside className="rail" aria-label="Skills">
      <h2 className="section-title">Skills</h2>
      {skillCategories.map((cat) => {
        const items = (skillsByCategory.get(cat.id) ?? []).filter(forWeb);
        if (items.length === 0) return null;
        return (
          <section key={cat.id} className="rail-cat">
            <h3 className="rail-cat-title">
              <span
                className="cat-dot"
                style={{ background: `var(--cat-${cat.id})` }}
                aria-hidden="true"
              />
              {cat.label}
            </h3>
            <div className="chip-row">
              {items.map((skill) => (
                <SkillChip key={skill.id} skill={skill} short={false} as="button" />
              ))}
            </div>
          </section>
        );
      })}
    </aside>
  );
}
