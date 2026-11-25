import { apiFetch } from "./http";
import type { ApplicationCreate, MessageOut } from "./types";

export function createApplication(payload: ApplicationCreate): Promise<MessageOut> {
  return apiFetch<MessageOut>("/api/applications", {
    method: "POST",
    body: payload,
  });
}
