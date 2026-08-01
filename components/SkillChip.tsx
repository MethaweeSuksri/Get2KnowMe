import {
  chipLabel,
  domainsBySkill,
  entitiesBySkill,
  skillHasEvidence,
} from "@/lib/portfolio";
import type { Skill } from "@/lib/types";

interface Props {
  skill: Skill;
  /** Chips use shortLabel; the rail and the résumé always use the full label. */
  short?: boolean;
  as?: "span" | "button" | "link";
  href?: string;
}

// Static data attributes carry every relationship the CSS highlight rules
// need; no JavaScript ever computes a match at runtime.
export default function SkillChip({ skill, short = true, as = "span", href }: Props) {
  const label = short ? chipLabel(skill) : skill.label;
  const evidence = entitiesBySkill.get(skill.id)?.join(" ");
  const chipDomains = domainsBySkill.get(skill.id)?.join(" ");
  // A skill with contexts but no project evidence shows its contexts in a
  // tooltip instead of dimming everything (nothing would match it).
  const tooltip =
    !skillHasEvidence(skill.id) && skill.contexts?.length
      ? skill.contexts.join(" · ")
      : undefined;
  const tipId = tooltip ? `tip-${skill.id}` : undefined;

  const dataAttrs = {
    "data-skill": skill.id,
    "data-evid": evidence,
    "data-chip-domains": chipDomains,
    ...(tooltip ? { "data-tip": "" } : {}),
  };

  const tip = tooltip ? (
    <span className="tip" role="tooltip" id={tipId}>
      {tooltip}
    </span>
  ) : null;

  if (as === "button") {
    return (
      <button type="button" className="chip" aria-describedby={tipId} {...dataAttrs}>
        {label}
        {tip}
      </button>
    );
  }
  if (as === "link" && href) {
    return (
      <a className="chip" href={href} {...dataAttrs}>
        {label}
      </a>
    );
  }
  return (
    <span className="chip" {...dataAttrs}>
      {label}
      {tip}
    </span>
  );
}
