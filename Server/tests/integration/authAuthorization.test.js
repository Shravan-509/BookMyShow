const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");
const { createMockResponse } = require("../helpers/mockExpress");

const JWT_SECRET = "test_jwt_secret";
const USER_ID = new mongoose.Types.ObjectId().toString();
const PARTNER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_PARTNER_ID = new mongoose.Types.ObjectId().toString();
const THEATRE_ID = new mongoose.Types.ObjectId().toString();

const loadAuthorization = () => {
  jest.resetModules();
  process.env.JWT_SECRET = JWT_SECRET;

  const User = {
    findById: jest.fn(),
  };

  jest.doMock("../../models/userSchema", () => User);

  return {
    User,
    ...require("../../middlewares/authorization"),
  };
};

const buildAuthApp = (role) => {
  const { User, validateJWT, validateRole } = loadAuthorization();
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ role }),
  });

  const app = express();
  app.use(cookieParser());
  app.get("/protected", validateJWT, (req, res) => {
    res.json({ success: true, userId: req.userId, role: req.user.role });
  });
  app.get("/admin", validateJWT, validateRole(["admin"]), (req, res) => {
    res.json({ success: true });
  });
  app.get("/partner", validateJWT, validateRole(["admin", "partner"]), (req, res) => {
    res.json({ success: true });
  });

  return app;
};

const bearerToken = (userId = USER_ID) => `Bearer ${jwt.sign({ userId }, JWT_SECRET)}`;

describe("authentication and route-level authorization", () => {
  test("denies unauthenticated protected endpoint", async () => {
    const response = await request(buildAuthApp("user")).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Unauthorized: No token provided",
    });
  });

  test("denies normal user on admin endpoint", async () => {
    const response = await request(buildAuthApp("user"))
      .get("/admin")
      .set("Authorization", bearerToken());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Forbidden: Insufficient permissions",
    });
  });

  test("denies normal user on partner privileged endpoint", async () => {
    const response = await request(buildAuthApp("user"))
      .get("/partner")
      .set("Authorization", bearerToken());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Forbidden: Insufficient permissions",
    });
  });

  test("allows admin on representative admin endpoint", async () => {
    const response = await request(buildAuthApp("admin"))
      .get("/admin")
      .set("Authorization", bearerToken());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  test("allows partner on partner privileged endpoint", async () => {
    const response = await request(buildAuthApp("partner"))
      .get("/partner")
      .set("Authorization", bearerToken());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });
});

describe("controller-level ownership authorization", () => {
  const loadShowController = (theatreOwner) => {
    jest.resetModules();

    const Theatre = {
      findById: jest.fn(),
    };
    const Show = {
      find: jest.fn(),
    };

    Theatre.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ owner: theatreOwner }),
    });
    Show.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([{ _id: "show-1" }]),
    });

    jest.doMock("../../models/theatreSchema", () => Theatre);
    jest.doMock("../../models/showSchema", () => Show);

    return {
      Theatre,
      Show,
      controller: require("../../controllers/ShowController"),
    };
  };

  test("allows partner to access owned theatre shows", async () => {
    const { controller, Show } = loadShowController(PARTNER_ID);
    const res = createMockResponse();

    await controller.getAllShowsByTheatre(
      {
        userId: PARTNER_ID,
        user: { role: "partner" },
        params: { id: THEATRE_ID },
      },
      res,
      jest.fn(),
    );

    expect(Show.find).toHaveBeenCalledWith({ theatre: THEATRE_ID });
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [{ _id: "show-1" }],
    }));
  });

  test("denies partner access to another partner's theatre shows", async () => {
    const { controller, Show } = loadShowController(OTHER_PARTNER_ID);
    const res = createMockResponse();

    await controller.getAllShowsByTheatre(
      {
        userId: PARTNER_ID,
        user: { role: "partner" },
        params: { id: THEATRE_ID },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });
    expect(Show.find).not.toHaveBeenCalled();
  });
});
