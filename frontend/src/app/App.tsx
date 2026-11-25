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
import { SpiralNav } from "@/widgets/spiral-nav";
import { Stack } from "@/widgets/stack";
import { isApiConfigured } from "@/shared/config";

import styles from "./App.module.css";

export function App() {
  const showApiSections = isApiConfigured();

  return (
    <div className={styles.page}>
      <a className="sr-only" href="#main">
        Skip to content
      </a>
      <Header />
      <SpiralNav />
      <main id="main">
        <Hero />
        <About />
        <Stack />
        <Experience />
        <Projects />
        <Education />
        {showApiSections ? <Reviews /> : null}
        {showApiSections ? <Apply /> : null}
        <Contacts />
      </main>
      <Footer />
    </div>
  );
}
