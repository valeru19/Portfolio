import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectItem } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";

import { hasProjectLink } from "./hasProjectLink";
import { ProjectCard } from "./ProjectCard";

const baseProject: ProjectItem = {
  name: "Demo Project",
  detail: "short",
  summary: { ru: "Кратко", en: "Summary" },
  stack: ["React"],
  points: { ru: ["Пункт"], en: ["Point"] },
  code: "",
  demo: "",
};

function renderCard(project: ProjectItem) {
  return render(
    <I18nProvider initialLang="en">
      <ProjectCard project={project} indexLabel="01" codeLabel="Code" demoLabel="Demo" />
    </I18nProvider>,
  );
}

describe("ProjectCard links", () => {
  it("hides Code and Demo when urls are empty", () => {
    renderCard(baseProject);
    expect(screen.queryByRole("link", { name: "Code" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Demo" })).not.toBeInTheDocument();
  });

  it("renders Code and Demo only for non-empty urls", () => {
    renderCard({
      ...baseProject,
      code: "https://github.com/valeru19/Portfolio",
      demo: "https://example.com",
    });
    expect(screen.getByRole("link", { name: "Code" })).toHaveAttribute(
      "href",
      "https://github.com/valeru19/Portfolio",
    );
    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("treats whitespace-only urls as empty", () => {
    expect(hasProjectLink("   ")).toBe(false);
    expect(hasProjectLink("https://x.test")).toBe(true);
  });
});
