const BASE_URL = "http://localhost:3000";

function getUrl(path: string): URL {
  return new URL(path, BASE_URL);
}

async function post<Req, Res>(url: string, body?: Req): Promise<Res | null> {
  const response = await fetch(getUrl(url), {
    method: "POST",
    credentials: "include",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Handle errors

  try {
    const json = await response.json();
    return json as Res;
  } catch (error) {
    // Handle errors
    return null;
  }
}

export const api = {
  post,
};
