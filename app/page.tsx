import { Suspense } from "react";
import DomainFilter, { DomainFilterStatic } from "@/components/DomainFilter";
import ExperienceList from "@/components/ExperienceList";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HighlightRoot from "@/components/HighlightRoot";
import IdentityBand from "@/components/IdentityBand";
import LeadershipBand from "@/components/LeadershipBand";
import ProjectGrid from "@/components/ProjectGrid";
import SkillsRail from "@/components/SkillsRail";
import { domains } from "@/lib/portfolio";

// The recruiter surface. Everything here is scan-layer data; nothing from a
// project's `engineering` block is ever read by this tree.
export default function LandingPage() {
  const domainOptions = domains.map(({ id, label }) => ({ id, label }));

  return (
    <>
      <Header />
      <main>
        <div className="shell">
          <IdentityBand />
        </div>
        <HighlightRoot>
          <div className="shell">
            <div className="body-grid">
              <div className="main-col">
                <section aria-label="Experience">
                  <h2 className="section-title">Experience</h2>
                  <ExperienceList />
                </section>
                <section id="projects" aria-label="Projects">
                  <h2 className="section-title">Projects</h2>
                  <Suspense fallback={<DomainFilterStatic domains={domainOptions} />}>
                    <DomainFilter domains={domainOptions} />
                  </Suspense>
                  <ProjectGrid />
                </section>
              </div>
              <SkillsRail />
            </div>
            <LeadershipBand />
          </div>
        </HighlightRoot>
      </main>
      <Footer />
    </>
  );
}
