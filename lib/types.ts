// Types mirroring the schema of portfolio.public.json (schemaVersion 3.1.0).

export type Surface = "both" | "web" | "resume";

export interface Meta {
  schemaVersion: string;
  lastUpdated: string;
  note?: string;
}

export interface ContactEntry {
  value: string | null;
  surface: Surface;
  label?: string;
  note?: string;
}

export interface Profile {
  fullName: string;
  preferredName: string;
  headline: string;
  targetRoles: string[];
  location: { city: string; country: string };
  availability: string;
  contact: Record<string, ContactEntry>;
  careerObjective: string;
  summary: string;
}

export interface Domain {
  id: string;
  label: string;
  color: string;
}

export interface SkillCategory {
  id: string;
  label: string;
}

export interface Skill {
  id: string;
  label: string;
  category: string;
  surface: Surface;
  shortLabel?: string;
  contexts?: string[];
}

export interface Coursework {
  code: string;
  name: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  status: string;
  gpax: number;
  gpaScale: number;
  honors: string;
  honorsStatus: string;
  location: string;
  relevantCoursework: Coursework[];
  surface: Surface;
}

export interface Highlight {
  text: string;
  skills?: string[];
  surface: Surface;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  domains: string[];
  summary: string;
  highlights: Highlight[];
  skills: string[];
  surface: Surface;
  priority: number;
}

export interface Decision {
  what: string;
  why: string;
  instead: string;
  ref: string;
}

export interface Engineering {
  architecture: string;
  decisions: Decision[];
}

export interface Team {
  size: number;
  role: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  context: string;
  year: number;
  domains: string[];
  repoUrl: string;
  demoUrl: string | null;
  media: string[];
  team: Team;
  summary: string;
  highlights: Highlight[];
  engineering: Engineering;
  skills: string[];
  featured: boolean;
  surface: Surface;
  priority: number;
}

export interface Leadership {
  id: string;
  title: string;
  context: string;
  relatedProjects: string[];
  highlights: Highlight[];
  skills: string[];
  surface: Surface;
  priority: number;
}

export interface ResumeRules {
  includeSurfaces: Surface[];
  maxProjects: number;
  maxHighlightsPerItem: number;
  maxSkillsPerCategoryLine: number;
  engineeringBlocksExcluded: string;
  privateBlocksExcluded: string;
  overflowStrategy: string;
  minPriority: number;
}

export interface ResumeConfig {
  fileName: string;
  pageLimit: number;
  generation: { method: string; note: string };
  sectionOrder: string[];
  rules: ResumeRules;
}

export interface SiteConfig {
  note: string;
  filterParam: string;
  shareableExample: string;
  disclosure: {
    layer1_scan: string[];
    layer2_card: string[];
    layer3_expanded: string[];
    note: string;
  };
}

export interface PortfolioData {
  meta: Meta;
  profile: Profile;
  domains: Domain[];
  skillCategories: SkillCategory[];
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  leadership: Leadership[];
  resume: ResumeConfig;
  site: SiteConfig;
}
