import { Controller, Get, INestApplication, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { Request } from "express";
import { Agent, agent as supertestAgent } from "supertest";
import { signHS256 } from "../auth/utils";
import { AppModule } from "src/app.module";
import { Configuration } from "src/config";
import { setupApp } from "src/setup";
import { aliceCredentials, authenticate } from "tests/utils";

@Controller("/fake-controller")
class FakeController {
  @Get()
  get(@Req() request: Request): unknown {
    return { session: request.session, sessionId: request.sessionId }; // Nest coerces null as empty object
  }
}

describe("SessionMiddleware", () => {
  let app: INestApplication;
  let sessionCookieName: string;
  const agent = (): Agent => supertestAgent(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FakeController],
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    setupApp(app);
    const configService = app.get(ConfigService<Configuration, true>);
    sessionCookieName = configService.get("session.cookieName", {
      infer: true,
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return a null session when no cookie provided", async () => {
    await agent()
      .get("/fake-controller")
      .expect(200, { session: null, sessionId: null });
  });

  it("should return a null session when invalid cookie provided", async () => {
    await agent()
      .get("/fake-controller")
      .set("Cookie", `${sessionCookieName}=unsignedsession`)
      .expect(200, { session: null, sessionId: null });

    await agent()
      .get("/fake-controller")
      .set("Cookie", `${sessionCookieName}=s:invalidsession.invalidsignature`)
      .expect(200, { session: null, sessionId: null });

    await agent()
      .get("/fake-controller")
      .expect(200, { session: null, sessionId: null });
  });

  it("should return a null session and remove the provided cookie when no session associated", async () => {
    const configService = app.get(ConfigService<Configuration, true>);
    const hs256Secret = configService.get("application.hs256Secret", {
      infer: true,
    });
    const signedToken = `s%3A${signHS256("123456", hs256Secret)}`;
    await agent()
      .get("/fake-controller")
      .set("Cookie", `${sessionCookieName}=${signedToken}`)
      .expect(200, { session: null, sessionId: null })
      .expect(
        "set-cookie",
        `${sessionCookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      );
  });

  it("should return the session when valid session associated to provided cookie", async () => {
    const sessionCookie = await authenticate(agent(), aliceCredentials);

    const response = await agent()
      .get("/fake-controller")
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(response.body.session).toEqual({
      id: 1,
      username: "alice",
      email: "alice@gmail.com",
      verified: true,
    });
    expect(response.body.sessionId).toBeDefined();
  });
});
