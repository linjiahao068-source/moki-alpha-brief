import "server-only";

import { getSecConfig } from "./config";

export class SecRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SecRequestError";
    this.status = status;
  }
}

export async function secFetchJson<T>(url: string): Promise<T> {
  const config = getSecConfig();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new SecRequestError(
      `SEC request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

export function getSafeSecError(error: unknown) {
  if (error instanceof SecRequestError) {
    if (error.status === 404) return "SEC resource not found";
    if (error.status === 429) return "SEC rate limit or request throttling";
    if (error.status && error.status >= 500) {
      return `SEC request failed with status ${error.status}`;
    }
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message.includes("CIK")
      ? error.message
      : "SEC provider request failed";
  }

  return "SEC provider request failed";
}
