const express = require("express");
const request = require("supertest");

const buildApp = (role = "admin") => {
  jest.resetModules();

  const cityService = {
    getCities: jest.fn().mockResolvedValue([{ _id: "city-1", cityName: "Bengaluru", isActive: true }]),
    getCityById: jest.fn().mockResolvedValue({ _id: "city-1", cityName: "Bengaluru", isActive: true }),
    createCity: jest.fn().mockResolvedValue({ _id: "city-1", cityName: "Bengaluru", isActive: true }),
    updateCity: jest.fn().mockResolvedValue({ _id: "city-1", cityName: "Bengaluru", isActive: true }),
    deactivateCity: jest.fn().mockResolvedValue({ _id: "city-1", cityName: "Bengaluru", isActive: false }),
  };

  jest.doMock("../../services/cityService", () => cityService);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (role) {
      req.user = { role };
    }
    next();
  });
  app.use("/cities", require("../../routes/cityRoute"));
  return { app, cityService };
};

describe("city routes", () => {
  test("lists cities for authenticated users", async () => {
    const { app } = buildApp("user");

    const response = await request(app).get("/cities");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  test("gets city by id", async () => {
    const { app, cityService } = buildApp("user");

    const response = await request(app).get("/cities/city-1");

    expect(response.status).toBe(200);
    expect(cityService.getCityById).toHaveBeenCalledWith("city-1");
  });

  test("allows admin city creation", async () => {
    const { app, cityService } = buildApp("admin");

    const response = await request(app)
      .post("/cities")
      .send({ cityName: "Bengaluru", state: "Karnataka", country: "India" });

    expect(response.status).toBe(201);
    expect(cityService.createCity).toHaveBeenCalledWith({
      cityName: "Bengaluru",
      state: "Karnataka",
      country: "India",
    });
  });

  test("denies unauthenticated city management", async () => {
    const { app } = buildApp(null);

    const response = await request(app)
      .post("/cities")
      .send({ cityName: "Bengaluru", state: "Karnataka", country: "India" });

    expect(response.status).toBe(403);
  });

  test("denies partner city management", async () => {
    const { app } = buildApp("partner");

    const response = await request(app)
      .patch("/cities/city-1")
      .send({ cityName: "Bengaluru", state: "Karnataka", country: "India" });

    expect(response.status).toBe(403);
  });

  test("allows admin city deactivation", async () => {
    const { app, cityService } = buildApp("admin");

    const response = await request(app).delete("/cities/city-1");

    expect(response.status).toBe(200);
    expect(cityService.deactivateCity).toHaveBeenCalledWith("city-1");
    expect(response.body.data.isActive).toBe(false);
  });
});
