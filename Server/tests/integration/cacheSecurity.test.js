const express = require("express");
const request = require("supertest");
const { cache, cacheUtils } = require("../../middlewares/cache");
const { staticCacheHeaders } = require("../../middlewares/performanceOptimization");

describe("cache and private response security", () => {
  afterEach(() => {
    cacheUtils.flushAll();
  });

  test("private API responses receive no-store cache headers", async () => {
    const app = express();
    app.use(staticCacheHeaders);
    app.get("/bms/v1/users/profile", (req, res) => {
      res.json({ success: true, user: { name: "User A" } });
    });

    const response = await request(app).get("/bms/v1/users/profile");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store");
  });

  test("shared catalogue cache replays catalogue response without user-specific data", async () => {
    let callCount = 0;
    const app = express();

    app.get("/bms/v1/movies", cache(60), (req, res) => {
      callCount += 1;
      res.json({
        success: true,
        data: [{ movieName: "Dune" }],
      });
    });

    const first = await request(app)
      .get("/bms/v1/movies")
      .set("Authorization", "Bearer user-a");
    const second = await request(app)
      .get("/bms/v1/movies")
      .set("Authorization", "Bearer partner-b");

    expect(first.headers["x-cache"]).toBe("MISS");
    expect(second.headers["x-cache"]).toBe("HIT");
    expect(callCount).toBe(1);
    expect(second.body).toEqual({
      success: true,
      data: [{ movieName: "Dune" }],
    });
    expect(JSON.stringify(second.body)).not.toContain("user-a");
    expect(JSON.stringify(second.body)).not.toContain("partner-b");
  });
});
