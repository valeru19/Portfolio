import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";

import { CopyEmailControl } from "./CopyEmailControl";

vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  return {
    ...actual,
    copyText: vi.fn().mockResolvedValue(true),
  };
});

describe("CopyEmailControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Copied feedback next to the button after a successful copy", async () => {
    const user = userEvent.setup();
    const { copyText } = await import("@/shared/lib");

    render(
      <I18nProvider initialLang="en">
        <CopyEmailControl email="hello@example.com" />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: content.contacts.copy.en }));
    expect(copyText).toHaveBeenCalledWith("hello@example.com");
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(content.contacts.copied.en);
    });
  });
});
