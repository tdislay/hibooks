import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { sign } from "cookie-signature";
import { Agent, agent as supertestAgent } from "supertest";
import { UserPasswordOmitted, UsersService } from "../users/users.service";
import { emailVerificationRedisPrefix } from "./emailVerification.service";
import { AppModule } from "src/app.module";
import { Configuration } from "src/config";
import { EmailService } from "src/infra/email";
import { RedisService } from "src/infra/redis";
import { setupApp } from "src/setup";
import { aliceCredentials, authenticate } from "src/tests/authenticate";
import { EmailStubService } from "src/tests/stubs/EmailStub.service";

describe("Authentication (e2e)", () => {
  let app: INestApplication;
  const agent = (): Agent => supertestAgent(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useClass(EmailStubService)
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Login", () => {
    it("should return a 400 when bad parameters", async () => {
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

    it("should successfuly set a session cookie on right credentials", async () => {
      const response = await agent()
        .post("/auth/login")
        .send(aliceCredentials)
        .expect(200);

      const setCookieHeader = response.headers["set-cookie"] as string | null;
      const session = setCookieHeader?.[0];
      expect(session).toBeDefined();
      expect(session).not.toBeNull();
      expect(session?.length).not.toBe(0);
      expect(response.body).toMatchObject<Partial<UserPasswordOmitted>>({
        id: 1,
        username: "alice",
        email: "alice@gmail.com",
      });

      await agent()
        .set("Cookie", [session])
        .post("/auth/logout")
        .expect(200) // 200 means the user is authenticated as the route use the Authenticated Guard
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
      const signedToken = `s%3A${sign("123456", process.env.HS256_SECRET!)}`;

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

  describe("Sign-in", () => {
    it("should return a 400 when bad parameters", async () => {
      // No parameters
      await agent()
        .post("/auth/sign-in")
        .expectPartial(400, { cause: [{}, {}, {}] });

      // Wrong parameters
      await agent()
        .post("/auth/sign-in")
        .send({
          email: "invalidEMAIL",
          username:
            "toomanycharactersssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
          password: "easy",
        })
        .expectPartial(400, {
          cause: [
            { code: "invalid_string" },
            { code: "too_big" },
            { code: "too_small" },
          ],
        });
    });

    it("should return a 409 on non unique username", async () => {
      await agent()
        .post("/auth/sign-in")
        .send({
          email: "valid@email.com",
          username: "alice",
          password: "password",
        })
        .expectPartial(409, { message: '"username" is not unique' });
    });

    it("should successfully sign-in and log-in a new user", async () => {
      await agent()
        .post("/auth/sign-in")
        .send({
          email: "myemail@fakedomain.com",
          username: "theo",
          password: "mysuperpassword",
        })
        .expectPartial(201, {
          email: "myemail@fakedomain.com",
          username: "theo",
          verified: false,
        })
        .expect("set-cookie", /session=s%3A.*/);
    });
  });

  describe("Verify account", () => {
    it("should return a 400 when bad parameters", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      // No parameters
      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .expectPartial(400, { cause: [{}] });

      // Malformed otp
      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp: "" })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp: "." })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp: "nodot" })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp: "nosignature." })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp: ".nocontent" })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });
    });

    it("should return a 404 not found when otp does not exist", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({
          otp: "content.signature",
        })
        .expect(404);
    });

    it("should return a 404 not found when otp is not valid", async () => {
      const redisService = app.get(RedisService);
      const initOtpKeys = await redisService.keys(
        `${emailVerificationRedisPrefix}:*`
      );

      const response = await agent().post("/auth/sign-in").send({
        username: "victim",
        password: "strongPa$$word",
        email: "victim@gmail.com",
      });
      const setCookieHeader = response.headers["set-cookie"] as string | null;
      const sessionCookie = setCookieHeader?.[0];

      const otpKeys = await redisService.keys(
        `${emailVerificationRedisPrefix}:*`
      );
      const otpKey = otpKeys.filter((key) => !initOtpKeys.includes(key))[0];
      const otp = otpKey.split(":")[2];
      expect(otp).toBeDefined();

      const tamperedOtp = `${otp}.wrong-signature`;
      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp: tamperedOtp })
        .expect(404);
    });

    it("should successfully verify an account", async () => {
      const emailService: EmailStubService = app.get(EmailService);
      const userService: UsersService = app.get(UsersService);
      const redisService = app.get(RedisService);

      const response = await agent()
        .post("/auth/sign-in")
        .send({
          username: "franklin",
          password: "strongPa$$word",
          email: "franklin@gmail.com",
        })
        .expectPartial(201, { verified: false });

      const userId = response.body.id;
      const setCookieHeader = response.headers["set-cookie"] as string | null;
      const sessionCookie = setCookieHeader?.[0];
      const mail = emailService.inbox.get("franklin@gmail.com")?.[0];
      const otp = mail?.content.html?.match(/href=".*?otp=(.*)"/)?.[1];
      const otpShouldBeInRedis = await redisService.get(
        `${emailVerificationRedisPrefix}:${otp?.split(".")[0]}`
      );

      expect(otp).toBeDefined();
      expect(otpShouldBeInRedis).not.toBeNull();
      await agent()
        .set("Cookie", sessionCookie)
        .post("/auth/verify-account")
        .send({ otp })
        .expect(200);

      const user = await userService.getById(userId);
      expect(user).toMatchObject<Partial<UserPasswordOmitted>>({
        username: "franklin",
        email: "franklin@gmail.com",
        verified: true,
      });

      const otpShouldNotBeInRedis = await redisService.get(
        `${emailVerificationRedisPrefix}:${otp?.split(".")[0]}`
      );
      expect(otpShouldNotBeInRedis).toBeNull();
    });
  });
});
