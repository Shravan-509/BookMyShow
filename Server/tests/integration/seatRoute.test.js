const express = require("express");
const request = require("supertest");

const buildApp = (role = "admin") => {
  jest.resetModules();

  const seatService = {
    getSeatById: jest.fn().mockResolvedValue({ _id: "seat-1", seatNumber: "A1" }),
    createSeat: jest.fn().mockResolvedValue({ _id: "seat-1", seatNumber: "A1" }),
    updateSeat: jest.fn().mockResolvedValue({ _id: "seat-1", seatNumber: "A2" }),
    disableSeat: jest.fn().mockResolvedValue({ _id: "seat-1", isActive: false }),
    getSeatsByScreen: jest.fn().mockResolvedValue({
      seats: [{ _id: "seat-1", seatNumber: "A1" }],
      summary: { capacity: 2, activeSeatCount: 1, remainingCapacity: 1, layoutStatus: "INCOMPLETE" },
    }),
    bulkCreateSeats: jest.fn().mockResolvedValue([{ _id: "seat-1", seatNumber: "A1" }]),
  };

  jest.doMock("../../services/seatService", () => seatService);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (role) {
      req.user = { role };
    }
    next();
  });
  app.use("/seats", require("../../routes/seatRoute"));
  app.use("/screens", require("../../routes/screenRoute"));
  return { app, seatService };
};

describe("seat routes", () => {
  test("allows admin Seat management", async () => {
    const { app, seatService } = buildApp("admin");
    const payload = {
      screen: "screen-1",
      seatNumber: "A1",
      row: "A",
      column: 1,
      seatType: "STANDARD",
    };

    const createResponse = await request(app).post("/seats").send(payload);
    const listResponse = await request(app).get("/screens/screen-1/seats");
    const bulkResponse = await request(app).post("/screens/screen-1/seats/bulk").send({
      rows: [{ row: "A", startColumn: 1, endColumn: 2, seatType: "STANDARD" }],
    });

    expect(createResponse.status).toBe(201);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.summary.layoutStatus).toBe("INCOMPLETE");
    expect(bulkResponse.status).toBe(201);
    expect(seatService.createSeat).toHaveBeenCalledWith(expect.objectContaining({
      user: { role: "admin" },
    }), payload);
  });

  test("allows partner Seat route access", async () => {
    const { app } = buildApp("partner");

    const response = await request(app).get("/seats/seat-1");

    expect(response.status).toBe(200);
    expect(response.body.data.seatNumber).toBe("A1");
  });

  test("denies user Seat management route access", async () => {
    const { app, seatService } = buildApp("user");

    const response = await request(app).post("/seats").send({ seatNumber: "A1" });

    expect(response.status).toBe(403);
    expect(seatService.createSeat).not.toHaveBeenCalled();
  });

  test("updates and disables Seats", async () => {
    const { app, seatService } = buildApp("admin");

    const updateResponse = await request(app).patch("/seats/seat-1").send({ seatType: "PREMIUM" });
    const deleteResponse = await request(app).delete("/seats/seat-1");

    expect(updateResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(seatService.updateSeat).toHaveBeenCalled();
    expect(seatService.disableSeat).toHaveBeenCalled();
  });
});
