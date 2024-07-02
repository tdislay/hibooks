import { Response, Test } from "supertest";
import TestAgent from "supertest/lib/agent";
import { LoginRequest } from "src/modules/auth/types";

export const aliceCredentials: LoginRequest = {
  username: "alice",
  password: "password",
};

/**
 * Authenticate a given user
 * @param agent Supertest agent. Must be using application's http server.
 * @param userCredentials User Credentials. Must be a valid user.
 * @returns A session cookie.
 */
export async function authenticate(
  agent: TestAgent<Test>,
  userCredentials: LoginRequest,
): Promise<string> {
  const response = await agent.post("/auth/login").send(userCredentials);

  return getSessionCookieFromResponse(response);
}

export function getSessionCookieFromResponse(response: Response): string {
  const setCookieHeader = response.headers["set-cookie"] as string | null;
  const session = setCookieHeader?.[0] as string;

  expect(session).toMatch(/session=s%3A.*HttpOnly; Secure; SameSite=Lax/);

  return session as string;
}
