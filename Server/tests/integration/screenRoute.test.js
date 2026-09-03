const express = require("express");
const request = require("supertest");

const buildApp = (role = "admin") => {
  jest.resetModules();

  const screenService = {
    getScreens: jest.fn().mockResolvedValue([{ _id: "screen-1", name: "Screen 1" }]),
    getScreenById: jest.fn().mockResolvedValue({ _id: "screen-1", name: "Screen 1" }),
    createScreen: jest.fn().mockResolvedValue({ _id: "screen-1", name: "Screen 1" }),
    updateScreen: jest.fn().mockResolvedValue({ _id: "screen-1", name: "Audi 1" }),
    deleteScreen: jest.fn().mockResolvedValue({ _id: "screen-1", deleted: true }),
  };

  jest.doMock("../../services/screenService", () => screenService);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (role) {
      req.user = { role };
    }
    next();
  });
  app.use("/screens", require("../../routes/screenRoute"));
  return { app, screenService };
};

describe("screen routes", () => {
  test("allows admin to create Screen", async () => {
    const { app, screenService } = buildApp("admin");
    const payload = {
      theatre: "theatre-1",
      name: "Screen 1",
      screenNumber: 1,
      capacity: 650,
    };

    const response = await request(app).post("/screens").send(payload);

    expect(response.status).toBe(201);
    expect(screenService.createScreen).toHaveBeenCalledWith(expect.objectContaining({
      user: { role: "admin" },
    }), payload);
  });

  test("allows partner Screen management route access", async () => {
    const { app } = buildApp("partner");

    const response = await request(app).get("/screens/screen-1");

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Screen 1");
  });

  test("denies user Screen management route access", async () => {
    const { app, screenService } = buildApp("user");

    const response = await request(app).post("/screens").send({ name: "Screen 1" });

    expect(response.status).toBe(403);
    expect(screenService.createScreen).not.toHaveBeenCalled();
  });

  test("updates and deletes Screens", async () => {
    const { app, screenService } = buildApp("admin");

    const updateResponse = await request(app).patch("/screens/screen-1").send({ name: "Audi 1" });
    const deleteResponse = await request(app).delete("/screens/screen-1");

    expect(updateResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(screenService.updateScreen).toHaveBeenCalled();
    expect(screenService.deleteScreen).toHaveBeenCalled();
  });
});
