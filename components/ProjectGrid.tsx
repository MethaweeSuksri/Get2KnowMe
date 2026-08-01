import ProjectCard from "./ProjectCard";
import { forWeb, projects } from "@/lib/portfolio";

export default function ProjectGrid() {
  return (
    <div className="pgrid">
      {projects.filter(forWeb).map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
