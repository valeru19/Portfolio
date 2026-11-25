export type ApplicationKind = "job" | "order";

export type ApplicationCreate = {
  name: string;
  contact: string;
  kind: ApplicationKind;
  message: string;
};

export type ReviewCreate = {
  name: string;
  text: string;
  rating: number;
};

export type ReviewPublic = {
  id: number;
  name: string;
  text: string;
  rating: number;
  created_at: string;
};

export type MessageOut = {
  detail: string;
};

export type ApiErrorCode = "validation" | "rate_limit" | "network" | "unknown";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;

  constructor(code: ApiErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}
