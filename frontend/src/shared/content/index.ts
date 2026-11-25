import { about as aboutSource } from "./about";
import { apply } from "./apply";
import { contacts } from "./contacts";
import { education } from "./education";
import { experience } from "./experience";
import { footer } from "./footer";
import { hero } from "./hero";
import { meta } from "./meta";
import { nav } from "./nav";
import { privacy } from "./privacy";
import { projects } from "./projects";
import { reviews } from "./reviews";
import { spiral } from "./spiral";
import { stack } from "./stack";

export type { ExperienceItem, TechLogo } from "./experience";
export type { ProjectItem } from "./projects";
export type { StackGroup, StackItem } from "./stack";
export {
  ALL_SECTION_IDS,
  getSectionIndexLabel,
  getVisibleSectionIds,
  type SectionId,
} from "./sectionIds";

const projectCount = String(projects.items.length);

const about = {
  ...aboutSource,
  stats: aboutSource.stats.map((stat) =>
    stat.id === "projects" ? { ...stat, value: projectCount } : { ...stat },
  ),
};

/** Typed site content (former legacy `CONTENT`), minus API base (see `shared/config/env`). */
export const content = {
  meta,
  nav,
  hero,
  about,
  stack,
  experience,
  projects,
  education,
  reviews,
  apply,
  contacts,
  spiral,
  footer,
  privacy,
} as const;

export type Content = typeof content;
