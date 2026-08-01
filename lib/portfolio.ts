// Loads portfolio.public.json at build time, validates it, and builds the
// indexes every surface renders from. Imported by server components only.
import "server-only";
import raw from "@/portfolio.public.json";
import type {
  Experience,
  Highlight,
  Leadership,
  PortfolioData,
  Project,
  Skill,
  Surface,
} from "./types";

const data = raw as unknown as PortfolioData;

function fail(message: string): never {
  throw new Error(`portfolio.public.json is invalid — ${message}`);
}

// ---------------------------------------------------------------------------
// Validation. A silently missing chip is invisible; a red build is not.
// ---------------------------------------------------------------------------

function scanForPrivateKeys(node: unknown, path: string): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => scanForPrivateKeys(item, `${path}[${i}]`));
  } else if (node !== null && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("_")) {
        fail(`private key "${key}" found at ${path} — keys beginning with "_" must never appear`);
      }
      scanForPrivateKeys(value, `${path}.${key}`);
    }
  }
}

scanForPrivateKeys(data, "$");

const skillIds = new Set(data.skills.map((s) => s.id));
const domainIds = new Set(data.domains.map((d) => d.id));
const categoryIds = new Set(data.skillCategories.map((c) => c.id));

if (skillIds.size !== data.skills.length) fail("duplicate skill id in the registry");

function checkSkillRefs(ids: string[] | undefined, where: string): void {
  for (const id of ids ?? []) {
    if (!skillIds.has(id)) fail(`${where} references unknown skill id "${id}"`);
  }
}

function checkDomainRefs(ids: string[] | undefined, where: string): void {
  for (const id of ids ?? []) {
    if (!domainIds.has(id)) fail(`${where} references unknown domain id "${id}"`);
  }
}

for (const skill of data.skills) {
  if (!categoryIds.has(skill.category)) {
    fail(`skill "${skill.id}" has unknown category "${skill.category}"`);
  }
}

for (const project of data.projects) {
  checkSkillRefs(project.skills, `project "${project.id}"`);
  checkDomainRefs(project.domains, `project "${project.id}"`);
  project.highlights.forEach((h, i) =>
    checkSkillRefs(h.skills, `project "${project.id}" highlight ${i}`),
  );
}

for (const exp of data.experience) {
  checkSkillRefs(exp.skills, `experience "${exp.id}"`);
  checkDomainRefs(exp.domains, `experience "${exp.id}"`);
  exp.highlights.forEach((h, i) =>
    checkSkillRefs(h.skills, `experience "${exp.id}" highlight ${i}`),
  );
}

for (const lead of data.leadership) {
  checkSkillRefs(lead.skills, `leadership "${lead.id}"`);
  for (const pid of lead.relatedProjects) {
    if (!data.projects.some((p) => p.id === pid)) {
      fail(`leadership "${lead.id}" references unknown project id "${pid}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Exports.
// ---------------------------------------------------------------------------

export const meta = data.meta;
export const profile = data.profile;
export const domains = data.domains;
export const skillCategories = data.skillCategories;
export const education = data.education;
export const leadership = data.leadership;
export const resumeConfig = data.resume;
export const siteConfig = data.site;

const byPriority = <T extends { priority: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => b.priority - a.priority);

export const projects: Project[] = byPriority(data.projects);
export const experiences: Experience[] = byPriority(data.experience);

export const skillById = new Map<string, Skill>(data.skills.map((s) => [s.id, s]));

export const skillsByProject = new Map<string, string[]>(
  data.projects.map((p) => [p.id, p.skills]),
);

// The inversion below IS the bidirectional hover feature.
export const projectsBySkill = new Map<string, string[]>();
for (const [projectId, ids] of skillsByProject) {
  for (const skillId of ids) {
    const list = projectsBySkill.get(skillId) ?? [];
    list.push(projectId);
    projectsBySkill.set(skillId, list);
  }
}

export const projectsByDomain = new Map<string, string[]>();
for (const domain of data.domains) {
  projectsByDomain.set(
    domain.id,
    data.projects.filter((p) => p.domains.includes(domain.id)).map((p) => p.id),
  );
}

export const skillsByCategory = new Map<string, Skill[]>(
  data.skillCategories.map((c) => [c.id, data.skills.filter((s) => s.category === c.id)]),
);

// Every entity (project, experience, leadership) that cites a skill — the
// evidence set behind each chip, used for entity-hover highlighting.
export const entitiesBySkill = new Map<string, string[]>();
for (const entity of [...data.projects, ...data.experience, ...data.leadership]) {
  for (const skillId of entity.skills) {
    const list = entitiesBySkill.get(skillId) ?? [];
    if (!list.includes(entity.id)) list.push(entity.id);
    entitiesBySkill.set(skillId, list);
  }
}

// Union of the domains of the projects that cite a skill. Drives "skills with
// no remaining visible project dim" while the domain filter is active.
export const domainsBySkill = new Map<string, string[]>();
for (const [skillId, projectIds] of projectsBySkill) {
  const set = new Set<string>();
  for (const pid of projectIds) {
    for (const d of data.projects.find((p) => p.id === pid)!.domains) set.add(d);
  }
  domainsBySkill.set(skillId, [...set]);
}

/** A skill has evidence when at least one project/experience/leadership cites it. */
export const skillHasEvidence = (id: string): boolean => entitiesBySkill.has(id);

export const chipLabel = (skill: Skill): string => skill.shortLabel ?? skill.label;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-01" → "Jan 2026" */
export function formatMonth(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export const formatRange = (start: string, end: string): string =>
  `${formatMonth(start)} – ${formatMonth(end)}`;

export const teamBadge = (team: { size: number; role: string }): string =>
  team.size === 1 ? "Solo" : `${team.role} · ${team.size}`;

const surfaceFilter = (allowed: Surface[]) => (s: { surface: Surface }) =>
  allowed.includes(s.surface);

export const forWeb = surfaceFilter(["both", "web"]);

// ---------------------------------------------------------------------------
// Résumé model. Applies resume.rules plus the overflow strategy so the output
// fits the one-page limit: résumé surfaces only, top `maxProjects` by priority,
// highlights capped, and skills without linked evidence dropped.
// ---------------------------------------------------------------------------

const RESUME_PROJECT_HIGHLIGHTS = 1; // overflow trim: one bullet per project fits pageLimit 1
const RESUME_TECH_LINE_SKILLS = 6;
const RESUME_SKILLS_PER_LINE = 6; // overflow trim: matches the approved reference's density
const RESUME_EXPERIENCE_HIGHLIGHTS = 2; // overflow trim below rules.maxHighlightsPerItem to hold pageLimit 1

export interface ResumeModel {
  projects: (Project & { resumeHighlights: Highlight[]; techLine: string })[];
  experiences: (Experience & { resumeHighlights: Highlight[] })[];
  leadership: Leadership[];
  skillLines: { category: string; labels: string[] }[];
}

export function buildResumeModel(): ResumeModel {
  const rules = data.resume.rules;
  const onResume = surfaceFilter(rules.includeSurfaces);

  const resumeProjects = projects
    .filter((p) => onResume(p) && p.priority >= rules.minPriority)
    .slice(0, rules.maxProjects)
    .map((p) => ({
      ...p,
      resumeHighlights: p.highlights.filter(onResume).slice(0, RESUME_PROJECT_HIGHLIGHTS),
      techLine: p.skills
        .slice(0, RESUME_TECH_LINE_SKILLS)
        .map((id) => skillById.get(id)!.label)
        .join(", "),
    }));

  const resumeExperiences = experiences
    .filter((e) => onResume(e) && e.priority >= rules.minPriority)
    .map((e) => ({
      ...e,
      resumeHighlights: e.highlights
        .filter(onResume)
        .slice(0, Math.min(rules.maxHighlightsPerItem, RESUME_EXPERIENCE_HIGHLIGHTS)),
    }));

  const resumeLeadership = leadership.filter(
    (l) => onResume(l) && l.priority >= rules.minPriority,
  );

  const skillLines = data.skillCategories
    .map((category) => ({
      category: category.label,
      labels: (skillsByCategory.get(category.id) ?? [])
        .filter((s) => onResume(s) && skillHasEvidence(s.id))
        .slice(0, RESUME_SKILLS_PER_LINE)
        .map((s) => s.label),
    }))
    .filter((line) => line.labels.length > 0);

  return {
    projects: resumeProjects,
    experiences: resumeExperiences,
    leadership: resumeLeadership,
    skillLines,
  };
}
