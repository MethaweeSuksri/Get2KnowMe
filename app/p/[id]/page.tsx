import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SkillChip from "@/components/SkillChip";
import {
  domainsBySkill,
  forWeb,
  profile,
  projects,
  skillById,
  teamBadge,
} from "@/lib/portfolio";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.filter(forWeb).map((p) => ({ id: p.id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  return project
    ? { title: `${project.title} — ${profile.fullName}`, description: project.tagline }
    : {};
}

const repoDisplay = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\.git$/, "");

// The engineer surface: the only place `engineering` renders.
export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <>
      <Header back />
      <main className="ppage">
        <h1>{project.title}</h1>
        <p className="tagline">{project.tagline}</p>
        <div className="meta-row">
          <span className="badge">{teamBadge(project.team)}</span>
          <span>
            {project.context} · {project.year}
          </span>
          {project.repoUrl && (
            <a href={project.repoUrl} rel="noopener">
              {repoDisplay(project.repoUrl)} ↗
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} rel="noopener">
              Live demo ↗
            </a>
          )}
        </div>
        <div className="media-placeholder">
          Media placeholder — screen capture of {project.title} will go here.
        </div>
        <p className="prose">{project.summary}</p>
        <section aria-label="Highlights">
          <h2>Highlights</h2>
          <ul>
            {project.highlights.filter(forWeb).map((h) => (
              <li key={h.text}>{h.text}</li>
            ))}
          </ul>
        </section>
        <section aria-label="Architecture">
          <h2>Architecture</h2>
          <p className="prose">{project.engineering.architecture}</p>
        </section>
        <section aria-label="Decisions">
          <h2>Decisions</h2>
          <div className="decision-list">
            {project.engineering.decisions.map((d) => (
              <dl className="decision" key={d.what}>
                <dt>What</dt>
                <dd>{d.what}</dd>
                <dt>Why</dt>
                <dd>{d.why}</dd>
                <dt>Instead of</dt>
                <dd>{d.instead}</dd>
                <dt>Ref</dt>
                <dd className="ref">{d.ref}</dd>
              </dl>
            ))}
          </div>
        </section>
        <section aria-label="Skills used">
          <h2>Skills</h2>
          <div className="chip-row">
            {project.skills.map((skillId) => {
              const linkedDomains =
                domainsBySkill.get(skillId) ?? project.domains;
              return (
                <SkillChip
                  key={skillId}
                  skill={skillById.get(skillId)!}
                  as="link"
                  href={`/?domain=${linkedDomains.join(",")}`}
                />
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
