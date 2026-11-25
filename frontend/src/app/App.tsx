import { About } from "@/widgets/about";
import { Contacts } from "@/widgets/contacts";
import { Education } from "@/widgets/education";
import { Experience } from "@/widgets/experience";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { Hero } from "@/widgets/hero";
import { Projects } from "@/widgets/projects";
import { SpiralNav } from "@/widgets/spiral-nav";
import { Stack } from "@/widgets/stack";

import styles from "./App.module.css";

export function App() {
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
        <Contacts />
      </main>
      <Footer />
    </div>
  );
}
