import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STORAGE_LANG } from "@/shared/config/storageKeys";
import { content } from "@/shared/content";

import { I18nProvider } from "./I18nProvider";
import { useI18n } from "./useI18n";
import { useT } from "./useT";

function Probe() {
  const { lang, setLang } = useI18n();
  const t = useT();
  return (
    <div>
      <p data-testid="lang">{lang}</p>
      <p data-testid="role">{String(t(content.meta.role))}</p>
      <button type="button" onClick={() => setLang(lang === "ru" ? "en" : "ru")}>
        switch
      </button>
    </div>
  );
}

describe("I18nProvider", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
    document.documentElement.removeAttribute("lang");
  });

  it("selects language and updates html lang + useT", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLang="ru">
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("lang")).toHaveTextContent("ru");
    expect(screen.getByTestId("role")).toHaveTextContent("Backend-разработчик");
    expect(document.documentElement.lang).toBe("ru");

    await user.click(screen.getByRole("button", { name: "switch" }));

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("role")).toHaveTextContent("Backend Developer");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(STORAGE_LANG)).toBe("en");
  });

  it("persists language choice to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLang="en">
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "switch" }));
    expect(window.localStorage.getItem(STORAGE_LANG)).toBe("ru");
  });

  it("still switches language when localStorage is unavailable", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });

    const user = userEvent.setup();
    render(
      <I18nProvider initialLang="ru">
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "switch" }));
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("role")).toHaveTextContent("Backend Developer");
  });
});
