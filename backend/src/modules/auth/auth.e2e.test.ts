import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { sign } from "cookie-signature";
import { Agent, agent as supertestAgent } from "supertest";
import { UserPasswordOmitted } from "../users/users.service";
import { AppModule } from "src/app.module";
import { Configuration } from "src/config";
import { setupApp } from "src/setup";
import { aliceCredentials, authenticate } from "src/tests/authenticate";

describe("Authentication (e2e)", () => {
  let app: INestApplication;
  const agent = (): Agent => supertestAgent(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Login", () => {
    it("should return 400 when wrong parameters", async () => {
      // No parameters
      await agent()
        .post("/auth/login")
        .expectPartial(400, {
          cause: [
            {
              code: "invalid_type",
              path: ["username"],
            },
            {
              code: "invalid_type",
              path: ["password"],
            },
          ],
        });

      // Wrong parameters
      await agent()
        .post("/auth/login")
        .send({ username: "", password: true })
        .expectPartial(400, {
          cause: [
            { code: "too_small" },
            { code: "invalid_type", received: "boolean" },
          ],
        });
    });

    it("should return a 401 Unauthorized on non-existent user", async () => {
      await agent()
        .post("/auth/login")
        .send({
          username: "non-existent user",
          password: "password",
        })
        .expectPartial(401, { message: "User not found" });
    });

    it("should return a 401 Unauthorized on wrong credentials", async () => {
      await agent()
        .post("/auth/login")
        .send({
          username: "alice",
          password: "totally wrong passord",
        })
        .expectPartial(401, { message: "Wrong credentials" });
    });

    it("should return a 403 Forbidden on already valid session", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/login")
        .send(aliceCredentials)
        .expectPartial(403, { message: "Forbidden" });
    });

    it("should return a valid session token on right credentials", async () => {
      const response = await agent()
        .post("/auth/login")
        .send(aliceCredentials)
        .expect(200);

      const setCookieHeader = response.headers["set-cookie"] as string | null;
      const session = setCookieHeader?.[0];
      expect(session).toBeDefined();
      expect(session).not.toBeNull();
      expect(session?.length).not.toBe(0);
      expect(response.body).toEqual<UserPasswordOmitted>({
        id: 1,
        username: "alice",
        email: "alice@gmail.com",
      });

      await agent()
        .set("Cookie", [session])
        .post("/auth/logout")
        .expect(200)
        .expect(
          "set-cookie",
          "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        );
    });
  });

  describe("Logout", () => {
    it("should return a 401 Unauthorized when no session token", async () => {
      await agent().post("/auth/logout").expect(401);
    });

    it("should return a 401 Unauthorized when token provided but no session associated", async () => {
      const configService = app.get(ConfigService<Configuration, true>);
      const sessionCookieName = configService.get("session.cookieName", {
        infer: true,
      });
      const unsignedToken = "123456";
      // express add a 's:' to indicate a cookie has been signed
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedToken = `s%3A${sign("123456", process.env.COOKIE_SECRET!)}`;

      await agent()
        .set("Cookie", [`${sessionCookieName}=${unsignedToken}`])
        .post("/auth/logout")
        .expect(401);

      await agent()
        .set("Cookie", [`${sessionCookieName}=${signedToken}`])
        .post("/auth/logout")
        .expect(401)
        .expect(
          "set-cookie",
          "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        );
    });
  });
});
