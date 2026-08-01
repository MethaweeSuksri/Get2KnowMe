import SkillChip from "./SkillChip";
import {
  forWeb,
  siteConfig,
  skillCategories,
  skillHasEvidence,
  skillsByCategory,
} from "@/lib/portfolio";

// The rail always uses the full label, never shortLabel. It must never
// inner-scroll (site.rail in the JSON governs what is trimmed to keep it
// within a viewport): contexts-only skills are omitted, and excludeCategories
// is the overflow ladder.
export default function SkillsRail() {
  const rail = siteConfig.rail;
  const excluded = new Set(rail.excludeCategories);

  return (
    <aside className="rail" aria-label="Skills">
      <h2 className="section-title">Skills</h2>
      {skillCategories.map((cat) => {
        if (excluded.has(cat.id)) return null;
        const items = (skillsByCategory.get(cat.id) ?? [])
          .filter(forWeb)
          .filter((s) => !rail.omitContextsOnlySkills || skillHasEvidence(s.id));
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
