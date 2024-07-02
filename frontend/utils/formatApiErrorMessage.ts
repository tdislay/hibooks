import { ApiError } from "@/core/api";

export function formatApiErrorMessage(error: ApiError): string {
  if (error.cause != null) {
    return error.cause
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("\n");
  }

  return error.message;
}
