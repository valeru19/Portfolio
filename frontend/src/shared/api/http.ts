import { getApiBase } from "@/shared/config";

import { ApiError } from "./types";

export function apiUrl(path: string): string {
  const base = getApiBase();
  if (!base) {
    throw new ApiError("unknown", "API base is not configured");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(path: string, init: JsonRequestInit = {}): Promise<T> {
  const { body, headers, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("network", "Network request failed");
  }

  if (response.status === 429) {
    throw new ApiError("rate_limit", "Too many requests", 429);
  }

  if (response.status === 422) {
    throw new ApiError("validation", "Validation failed", 422);
  }

  if (!response.ok) {
    throw new ApiError("unknown", `Request failed with status ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
