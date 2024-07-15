import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Agent, agent as supertestAgent } from "supertest";
import { AppModule } from "src/app.module";
import { setupApp } from "src/setup";

describe("Books", () => {
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

  describe("Search", () => {
    it("should successfully return a list of books", async () => {
      await agent()
        .get("/books")
        .expectPartial(200, [
          {
            title: "L'âme du mal",
            authors: [
              {
                firstname: "Maxime",
                lastname: "Chattam",
              },
            ],
            publisher: {
              name: "POCKET",
            },
          },
          {
            title: "In Tenebris",
            authors: [
              {
                firstname: "Maxime",
                lastname: "Chattam",
              },
            ],
            publisher: {
              name: "POCKET",
            },
          },
        ]);
    });
  });

  describe("Get", () => {
    it("should return a 400 on non invalid id", async () => {
      await agent().get("/books/foo").expect(400);
      await agent().get("/books/123foo").expect(400);
      await agent().get("/books/-158").expect(400);
    });

    it("should return a 404 on non existing id", async () => {
      await agent().get("/books/123456789").expect(404);
    });

    it("should successfully return the book", async () => {
      await agent()
        .get("/books/1")
        .expectPartial(200, {
          title: "L'âme du mal",
          authors: [
            {
              firstname: "Maxime",
              lastname: "Chattam",
            },
          ],
          publisher: {
            name: "POCKET",
          },
          genre: {
            name: "Thriller",
          },
          series: {
            name: "La trilogie du mal",
          },
        });
    });
  });
});
