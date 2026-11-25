import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";

import { ApplicationForm } from "./ApplicationForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider initialLang="en">
        <ApplicationForm />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("ApplicationForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ detail: "Application received" }),
      }),
    );
    vi.stubEnv("VITE_API_BASE", "http://127.0.0.1:8000");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("shows validation errors for empty submit", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: content.apply.submit.en }));
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits successfully and shows success message", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(content.apply.name.en), "Ivan Petrov");
    await user.type(screen.getByLabelText(content.apply.contact.en), "@ivan");
    await user.type(
      screen.getByLabelText(content.apply.message.en),
      "I would like to discuss a backend role with you.",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: content.apply.submit.en }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(content.apply.success.en);
    });
    expect(fetch).toHaveBeenCalled();
  });

  it("shows rate-limit error on 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ detail: "Too many" }),
      }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(content.apply.name.en), "Ivan Petrov");
    await user.type(screen.getByLabelText(content.apply.contact.en), "@ivan");
    await user.type(
      screen.getByLabelText(content.apply.message.en),
      "I would like to discuss a backend role with you.",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: content.apply.submit.en }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(content.apply.tooManyRequests.en);
    });
  });

  it("shows network error when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(content.apply.name.en), "Ivan Petrov");
    await user.type(screen.getByLabelText(content.apply.contact.en), "@ivan");
    await user.type(
      screen.getByLabelText(content.apply.message.en),
      "I would like to discuss a backend role with you.",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: content.apply.submit.en }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(content.apply.error.en);
    });
  });
});
