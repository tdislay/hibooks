import "./supertestExpectPartial";

// beforeEach should be used to ensure test idempotence
beforeAll(async () => {
  const { applyFixtures } = await import("../../prisma/fixtures");
  await applyFixtures();
});
