import { Test } from "supertest";
import TestAgent from "supertest/lib/agent";
import { LoginDto } from "src/modules/auth/auth.controller";

export const aliceCredentials: LoginDto = {
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
  userCredentials: LoginDto,
): Promise<string> {
  const response = await agent.post("/auth/login").send(userCredentials);

  const setCookieHeader = response.headers["set-cookie"] as string | null;
  const session = setCookieHeader?.[0];

  expect(session).toMatch(/session=s%3A.*HttpOnly; Secure; SameSite=Lax/);

  return session as string;
}
