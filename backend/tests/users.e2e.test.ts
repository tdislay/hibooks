import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Agent, agent as supertestAgent } from "supertest";
import { AppModule } from "src/app.module";
import { setupApp } from "src/setup";

describe("Users (e2e)", () => {
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
    agent();
    await app.close();
  });

  it("A", () => {});
});
