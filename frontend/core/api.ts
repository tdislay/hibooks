import { ZodIssue } from "zod";

export type ApiError = {
  message: string;
  statusCode: number;
  cause?: ZodIssue[];
};

export type ApiResponse<Res> =
  | { result: Res; error: null }
  | { result: null; error: ApiError };

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function getUrl(path: string): URL {
  return new URL(path, BACKEND_URL);
}

async function request<Res>(
  method: string,
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<Res>> {
  let response: Response;
  try {
    const url = getUrl(path);

    response = await fetch(url, {
      method,
      credentials: "include",
      ...init,
    });
  } catch (error) {
    // TODO: Send a Toast error
    console.error(error);

    const message = (error as Error).message;
    return {
      result: null,
      error: { message, statusCode: -1 },
    };
  }

  try {
    const body = (await response.json()) as Res | ApiError;

    if (!response.ok) {
      return { result: null, error: body as ApiError };
    }

    return { result: body as Res, error: null };
  } catch {
    // Can't parse json, then body is empty
    return { result: {} as Res, error: null };
  }
}

async function get<Req extends Record<string, string | number | boolean>, Res>(
  path: `/${string}`,
  query?: Req,
  init?: RequestInit,
): Promise<ApiResponse<Res>> {
  const queryWithoutUndefineds: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (value !== undefined) {
      queryWithoutUndefineds[key] = value as string; // URLSearchParams will convert numbers and booleans to string, either way
    }
  }

  const pathWithQueryIfPresent =
    query != null
      ? `${path}?${new URLSearchParams(queryWithoutUndefineds).toString()}`
      : path;

  return request("GET", pathWithQueryIfPresent, init);
}

async function post<Req, Res>(
  path: `/${string}`,
  body?: Req,
): Promise<ApiResponse<Res>> {
  return request("POST", path, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const api = {
  get,
  post,
};
