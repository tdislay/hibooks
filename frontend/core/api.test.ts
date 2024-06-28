import { vi } from "vitest";
import { api } from "./api";

// Prevent fetch on network error to log to console
console.error = () => {};

describe("Api", () => {
  beforeEach(() => {
    // Mock the fetch function
    vi.spyOn(global, "fetch").mockImplementation((input, _init) => {
      if (input.toString().includes("nest-error")) {
        return Promise.resolve({
          status: 401,
          json: () =>
            Promise.resolve({ message: "Unauthorized", statusCode: 401 }),
        } as Response);
      }

      if (input.toString().includes("zod-error")) {
        return Promise.resolve({
          status: 400,
          json: () =>
            Promise.resolve({
              message: "Bad Request",
              statusCode: 400,
              cause: [
                {
                  message: "Invalid value",
                  path: ["param1"],
                  code: "invalid_type",
                  expected: "string",
                  received: "number",
                },
              ],
            }),
        } as Response);
      }

      return Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      } as Response);
    });
  });

  describe("Get", () => {
    it("should successfully fetch without query params", async () => {
      await api.get("/my-endpoint");

      expect(global.fetch).toHaveBeenCalledWith(
        new URL("http://localhost:3000/my-endpoint"),
        { method: "GET", credentials: "include" },
      );
    });

    it("should successfully fetch with query params", async () => {
      await api.get("/my-endpoint", { param1: "value1", param2: "value2" });

      expect(global.fetch).toHaveBeenCalledWith(
        new URL(
          "http://localhost:3000/my-endpoint?param1=value1&param2=value2",
        ),
        { method: "GET", credentials: "include" },
      );
    });
  });

  describe("Post", () => {
    it("should successfully fetch without body", async () => {
      await api.post("/my-endpoint");

      expect(global.fetch).toHaveBeenCalledWith(
        new URL("http://localhost:3000/my-endpoint"),
        {
          method: "POST",
          credentials: "include",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { "Content-Type": "application/json" },
          body: undefined,
        },
      );
    });

    it("should successfully fetch with body", async () => {
      await api.post("/my-endpoint", { param1: "value1", param2: "value2" });

      expect(global.fetch).toHaveBeenCalledWith(
        new URL("http://localhost:3000/my-endpoint"),
        {
          method: "POST",
          credentials: "include",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ param1: "value1", param2: "value2" }),
        },
      );
    });
  });

  // Using api.get to test api.request() (as it is not exported)
  describe("Request", () => {
    it("should return a NestJS Error", async () => {
      const { result, error } = await api.get("/nest-error");

      expect(result).toBeNull();
      expect(error).toEqual({
        message: "Unauthorized",
        statusCode: 401,
      });
    });

    it("should return a Zod Error", async () => {
      const { result, error } = await api.get("/zod-error");

      expect(result).toBeNull();
      expect(error).toEqual({
        message: "Bad Request",
        statusCode: 400,
        cause: [
          {
            message: "Invalid value",
            path: ["param1"],
            code: "invalid_type",
            expected: "string",
            received: "number",
          },
        ],
      });
    });

    it("should return a Network error if can't access the server", async () => {
      vi.restoreAllMocks();
      const { result, error } = await api.get(
        "https://unexistent.localhost:4242" as never,
      );

      expect(result).toBeNull();
      expect(error).toEqual({
        // Error message is not the same in node ("fetch failed") / browser ("Network Error")
        message: "fetch failed",
        statusCode: -1,
      });
    });

    it("should successfully return a response", async () => {
      const { result, error } = await api.get("/my-endpoint");

      expect(error).toBeNull();
      expect(result).toEqual({ data: "test" });
    });
  });
});
