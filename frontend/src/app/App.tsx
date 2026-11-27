import { useMemo } from "react";

import {
  SpiralHud,
  SpiralNavigationProvider,
  SpiralPerfOverlay,
  SpiralStage,
} from "@/features/section-navigation";
import { hasPrivacyContactChannel, isApiConfigured } from "@/shared/config";
import { content, getVisibleSectionIds } from "@/shared/content";
import { useT } from "@/shared/i18n";
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
  const t = useT();
  // Стабильный identity: иначе каждый рендер (язык) → новый массив → killMotion.
  const apiEnabled = isApiConfigured();
  const contactChannel = hasPrivacyContactChannel();
  const sectionIds = useMemo(
    () => getVisibleSectionIds({ apiEnabled, hasContactChannel: contactChannel }),
    [apiEnabled, contactChannel],
  );
  const showFormSections = sectionIds.includes("apply");

  return (
    <SpiralNavigationProvider sectionIds={sectionIds}>
      <div className={styles.page}>
        <a className="sr-only" href="#main">
          {t(content.a11y.skipToContent)}
        </a>
        <Header />
        <SpiralHud />
        <SpiralPerfOverlay />
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
