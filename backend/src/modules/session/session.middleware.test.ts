import { Controller, Get, INestApplication, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { sign } from "cookie-signature";
import { Request } from "express";
import { Agent, agent as supertestAgent } from "supertest";
import { UserPasswordOmitted } from "../users/users.service";
import { AppModule } from "src/app.module";
import { Configuration } from "src/config";
import { setupApp } from "src/setup";
import { aliceCredentials, authenticate } from "tests/authenticate";

@Controller("/fake-controller")
class FakeController {
  @Get()
  get(@Req() request: Request): UserPasswordOmitted | null {
    return request.session; // Nest coerces null as empty object
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

  it("should return null when no cookie provided", async () => {
    await agent().get("/fake-controller").expect(200, {});
  });

  it("should return null when invalid cookie provided", async () => {
    await agent()
      .get("/fake-controller")
      .set("Cookie", `${sessionCookieName}=unsignedsession`)
      .expect(200, {});

    await agent()
      .get("/fake-controller")
      .set("Cookie", `${sessionCookieName}=s:invalidsession.invalidsignature`)
      .expect(200, {});

    await agent().get("/fake-controller").expect(200, {});
  });

  it("should return an empty object and remove the provided cookie when no session associated", async () => {
    const configService = app.get(ConfigService<Configuration, true>);
    const hs256Secret = configService.get("application.hs256Secret", {
      infer: true,
    });
    const signedToken = `s%3A${sign("123456", hs256Secret)}`;
    await agent()
      .get("/fake-controller")
      .set("Cookie", `${sessionCookieName}=${signedToken}`)
      .expect(200, {})
      .expect(
        "set-cookie",
        `${sessionCookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      );
  });

  it("should return the session when valid session associated to provided cookie", async () => {
    const sessionCookie = await authenticate(agent(), aliceCredentials);

    await agent()
      .get("/fake-controller")
      .set("Cookie", sessionCookie)
      .expect(200, {
        id: 1,
        username: "alice",
        email: "alice@gmail.com",
        verified: true,
      });
  });
});
