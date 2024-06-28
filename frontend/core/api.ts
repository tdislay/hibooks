import { ZodIssue } from "zod";

export type ApiError = {
  message: string;
  statusCode: number;
  cause?: ZodIssue[];
};

type ApiResponse<Res> =
  | { result: Res; error: null }
  | { result: null; error: ApiError };

const BASE_URL = "http://localhost:3000";

function getUrl(path: string): URL {
  return new URL(path, BASE_URL);
}

async function request<Res>(
  method: string,
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<Res>> {
  try {
    const url = getUrl(path);

    const response = await fetch(url, {
      method,
      credentials: "include",
      ...init,
    });

    const body = (await response.json()) as Res | ApiError;

    if (!response.ok) {
      return { result: null, error: body as ApiError };
    }

    return { result: body as Res, error: null };
  } catch (error) {
    // TODO: Send a Toast error
    console.error(error);

    const message = (error as Error).message;
    return {
      result: null,
      error: { message, statusCode: -1 },
    };
  }
}

async function get<Req extends Record<string, string>, Res>(
  path: `/${string}`,
  query?: Req,
  init?: RequestInit,
): Promise<ApiResponse<Res>> {
  const pathWithQueryIfPresent =
    query != null ? `${path}?${new URLSearchParams(query).toString()}` : path;

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
