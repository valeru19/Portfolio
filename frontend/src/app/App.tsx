import { SpiralHud, SpiralNavigationProvider, SpiralStage } from "@/features/section-navigation";
import { getVisibleSectionIds } from "@/shared/content";
import { About } from "@/widgets/about";
import { Apply } from "@/widgets/apply";
import { Contacts } from "@/widgets/contacts";
import { Education } from "@/widgets/education";
import { Experience } from "@/widgets/experience";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { Hero } from "@/widgets/hero";
import { Projects } from "@/widgets/projects";
import { Reviews } from "@/widgets/reviews";
import { Stack } from "@/widgets/stack";

import styles from "./App.module.css";

export function App() {
  const sectionIds = getVisibleSectionIds();
  const showFormSections = sectionIds.includes("apply");

  return (
    <SpiralNavigationProvider sectionIds={sectionIds}>
      <div className={styles.page}>
        <a className="sr-only" href="#main">
          Skip to content
        </a>
        <Header />
        <SpiralHud />
        <SpiralStage>
          <Hero />
          <About />
          <Stack />
          <Experience />
          <Projects />
          <Education />
          {showFormSections ? <Reviews /> : null}
          {showFormSections ? <Apply /> : null}
          <Contacts endSlot={<Footer />} />
        </SpiralStage>
      </div>
    </SpiralNavigationProvider>
  );
}
