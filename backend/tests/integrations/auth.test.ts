import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { Agent, agent as supertestAgent } from "supertest";
import { emailVerificationRedisPrefix } from "../../src/modules/auth/emailVerification.service";
import { UserPrivate } from "../../src/modules/users/types";
import { EmailStubService } from "../stubs/EmailStub.service";
import {
  aliceCredentials,
  authenticate,
  getSessionCookieFromResponse,
} from "../utils";
import { AppModule } from "src/app.module";
import { EmailService } from "src/infra/email";
import { RedisService } from "src/infra/redis";
import { signHS256 } from "src/modules/auth/utils";
import { SessionService } from "src/modules/session/session.service";
import { setupApp } from "src/setup";

describe("Authentication", () => {
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
    it("should return a 400 on bad parameters", async () => {
      // No parameters
      await agent()
        .post("/auth/login")
        .expectPartial(400, {
          cause: [
            { code: "invalid_type", path: ["username"], received: "undefined" },
            { code: "invalid_type", path: ["password"], received: "undefined" },
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
          rememberMe: true,
        })
        .expectPartial(401, { message: "User not found" });
    });

    it("should return a 401 Unauthorized on wrong credentials", async () => {
      await agent()
        .post("/auth/login")
        .send({
          username: "alice",
          password: "totally wrong passord",
          rememberMe: true,
        })
        .expectPartial(401, { message: "Wrong credentials" });
    });

    it("should return a 403 Forbidden on already valid session", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      await agent()
        .post("/auth/login")
        .set("Cookie", sessionCookie)
        .send(aliceCredentials)
        .expectPartial(403, { message: "Forbidden" });
    });

    it("should successfully login and set a session-lived cookie on right credentials", async () => {
      const sessionService = app.get(SessionService);
      const response = await agent()
        .post("/auth/login")
        .send(aliceCredentials)
        .expectPartial<Partial<UserPrivate>>(200, {
          id: 1,
          username: "alice",
          email: "alice@gmail.com",
        });

      const sessionCookie = getSessionCookieFromResponse(response);
      const session = sessionCookie.match(/(?<=s%3A).*(?=\.)/)?.[0] as string;
      const redisSession = await sessionService.get(session);

      expect(sessionCookie).not.toMatch(/Max-Age/); // Session-lived Cookie
      expect(redisSession).toMatchObject<Partial<UserPrivate>>({
        email: "alice@gmail.com",
        id: 1,
        username: "alice",
        verified: true,
      });
    });

    it("should succesfully set a long-lived cookie on right credentials", async () => {
      const configService = app.get(ConfigService);
      const maxAge = configService.get("session.cookie.maxAge", {
        infer: true,
      });

      await agent()
        .post("/auth/login")
        .send({ ...aliceCredentials, rememberMe: true })
        .expect(200)
        .expect("set-cookie", new RegExp(`Max-Age=${maxAge}`));
    });
  });

  describe("Logout", () => {
    it("should return a 401 Unauthorized when not logged in", async () => {
      await agent().post("/auth/logout").expect(401);
    });

    it("should successfully logout a logged-in user and remove their cookie", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      await agent()
        .post("/auth/logout")
        .set("Cookie", sessionCookie)
        .expect(200)
        .expect(
          "set-cookie",
          "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        );
    });
  });

  describe("Sign up", () => {
    it("should return a 400 on bad parameters", async () => {
      // No parameters
      await agent()
        .post("/auth/sign-up")
        .expectPartial(400, { cause: [{}, {}, {}] });

      // Wrong parameters
      await agent()
        .post("/auth/sign-up")
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
        .post("/auth/sign-up")
        .send({
          email: "valid@email.com",
          username: "alice",
          password: "password",
        })
        .expectPartial(409, { message: '"username" already exists' });
    });

    it("should successfully sign-up a new user and set a long-lived cookie", async () => {
      await agent()
        .post("/auth/sign-up")
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
        .expect("set-cookie", /session=s%3A.*Max-Age/);

      await agent()
        .post("/auth/login")
        .send({
          username: "theo",
          password: "mysuperpassword",
        })
        .expect(200);
    });
  });

  describe("Verify account", () => {
    it("should return a 400 on bad parameters", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      // No parameters
      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .expectPartial(400, { cause: [{}] });

      // Malformed otp
      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp: "" })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp: "." })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp: "nodot" })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp: "nosignature." })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });

      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp: ".nocontent" })
        .expectPartial(400, { cause: [{ message: "Malformed OTP" }] });
    });

    it("should return a 404 Not Found when otp is not valid", async () => {
      const redisService = app.get(RedisService);
      const initOtpKeys = await redisService.keys(
        `${emailVerificationRedisPrefix}:*`,
      );

      const response = await agent().post("/auth/sign-up").send({
        username: "victim",
        password: "strongPa$$word",
        email: "victim@gmail.com",
      });
      const sessionCookie = getSessionCookieFromResponse(response);

      await agent()
        .post("/auth/verification-email")
        .set("Cookie", sessionCookie)
        .expect(200);

      const otpKeys = await redisService.keys(
        `${emailVerificationRedisPrefix}:*`,
      );
      const otp = otpKeys.filter((key) => !initOtpKeys.includes(key))[0];
      const otpContent = otp.split(":")[2];
      expect(otpContent).toBeDefined();

      const tamperedOtp = signHS256(otpContent, "wrong-signature");
      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp: tamperedOtp })
        .expect(404);
    });

    it("should return a 404 Not Found when valid otp does not exist / expired", async () => {
      const configService = app.get(ConfigService);
      const hs256Secret = configService.get("application.hs256Secret", {
        infer: true,
      });

      const sessionCookie = await authenticate(agent(), aliceCredentials);
      const otp = signHS256("expired-token", hs256Secret);

      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp })
        .expect(404);
    });

    it("should return a 401 Unauthorized when not logged in", async () => {
      await agent().post("/auth/verification-email").expect(401);
    });

    it("should return a 403 Forbidden when account is already verified", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);
      await agent()
        .post("/auth/verification-email")
        .set("Cookie", sessionCookie)
        .expect(403);
    });

    it("should successfully verify an account", async () => {
      const emailService: EmailStubService = app.get(EmailService);
      const redisService = app.get(RedisService);

      const response = await agent()
        .post("/auth/sign-up")
        .send({
          username: "franklin",
          password: "strongPa$$word",
          email: "franklin@gmail.com",
        })
        .expectPartial(201, { verified: false });
      const sessionCookie = getSessionCookieFromResponse(response);

      await agent()
        .post("/auth/verification-email")
        .set("Cookie", sessionCookie)
        .expect(200);

      const mail = emailService.inbox.get("franklin@gmail.com")?.[0];
      const otp = mail?.content.html?.match(/href=".*?otp=(.*)"/)?.[1];
      const otpShouldBeInRedis = await redisService.get(
        `${emailVerificationRedisPrefix}:${otp?.split(".")[0]}`,
      );

      expect(otp).toBeDefined();
      expect(otpShouldBeInRedis).not.toBeNull();
      await agent()
        .post("/auth/verify-account")
        .set("Cookie", sessionCookie)
        .send({ otp })
        .expect(200);

      const { body: user } = await agent()
        .get("/auth/me")
        .set("Cookie", sessionCookie)
        .expect(200);
      expect(user).toMatchObject<Partial<UserPrivate>>({
        username: "franklin",
        email: "franklin@gmail.com",
        verified: true,
      });

      const otpShouldNotBeInRedis = await redisService.get(
        `${emailVerificationRedisPrefix}:${otp?.split(".")[0]}`,
      );
      expect(otpShouldNotBeInRedis).toBeNull();
    });
  });

  describe("Me", () => {
    it("should return a 401 Unauthorized when not logged in", async () => {
      await agent().get("/auth/me").expect(401);
    });

    it("should return the user session when logged in", async () => {
      const sessionCookie = await authenticate(agent(), aliceCredentials);

      await agent().get("/auth/me").set("Cookie", sessionCookie).expect(200, {
        id: 1,
        username: "alice",
        email: "alice@gmail.com",
        verified: true,
      });
    });
  });
});
