const mongoose = require("mongoose");
const { createMockResponse } = require("../helpers/mockExpress");

const USER_ID = new mongoose.Types.ObjectId().toString();
const THEATRE_ID = new mongoose.Types.ObjectId().toString();
const CITY_ID = new mongoose.Types.ObjectId().toString();

const createTheatreConstructor = () => {
  const Theatre = jest.fn(function TheatreModel(payload) {
    Object.assign(this, payload);
    this.save = jest.fn().mockResolvedValue(this);
  });

  Theatre.findOne = jest.fn();
  Theatre.findById = jest.fn();
  Theatre.findByIdAndUpdate = jest.fn();
  Theatre.findByIdAndDelete = jest.fn();
  Theatre.find = jest.fn();

  return Theatre;
};

const loadController = () => {
  jest.resetModules();

  const Theatre = createTheatreConstructor();
  const User = { findById: jest.fn() };
  const cityService = { ensureActiveCity: jest.fn().mockResolvedValue({ _id: CITY_ID }) };

  jest.doMock("../../models/theatreSchema", () => Theatre);
  jest.doMock("../../models/userSchema", () => User);
  jest.doMock("../../services/cityService", () => cityService);

  return {
    controller: require("../../controllers/TheatreController"),
    Theatre,
    User,
    cityService,
  };
};

const theatreBody = (overrides = {}) => ({
  name: "PVR Orion",
  address: "Mall Road",
  phone: 9876543210,
  email: "pvr@example.com",
  owner: USER_ID,
  ...overrides,
});

describe("theatre city integration", () => {
  test("allows theatre creation with a valid active city", async () => {
    const { controller, Theatre, cityService } = loadController();
    Theatre.findOne.mockResolvedValue(null);
    const res = createMockResponse();

    await controller.addTheatre(
      { body: theatreBody({ city: CITY_ID }), userId: USER_ID, user: { role: "partner" } },
      res,
      jest.fn(),
    );

    expect(cityService.ensureActiveCity).toHaveBeenCalledWith(CITY_ID);
    expect(Theatre).toHaveBeenCalledWith(expect.objectContaining({ city: CITY_ID, owner: USER_ID }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("rejects invalid or inactive city references", async () => {
    const { controller, Theatre, cityService } = loadController();
    Theatre.findOne.mockResolvedValue(null);
    cityService.ensureActiveCity.mockRejectedValue(new Error("City must reference an active city"));
    const res = createMockResponse();
    const next = jest.fn();

    await controller.addTheatre(
      { body: theatreBody({ city: CITY_ID }), userId: USER_ID, user: { role: "partner" } },
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(Theatre).not.toHaveBeenCalled();
  });

  test("legacy theatre creation without city remains usable", async () => {
    const { controller, Theatre, cityService } = loadController();
    Theatre.findOne.mockResolvedValue(null);
    const res = createMockResponse();

    await controller.addTheatre(
      { body: theatreBody(), userId: USER_ID, user: { role: "partner" } },
      res,
      jest.fn(),
    );

    expect(cityService.ensureActiveCity).not.toHaveBeenCalled();
    expect(Theatre).toHaveBeenCalledWith(expect.not.objectContaining({ city: expect.anything() }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("populates city when theatres are returned", async () => {
    const { controller, Theatre, User } = loadController();
    User.findById.mockResolvedValue({ _id: USER_ID, role: "partner" });
    const populateOwnerQuery = {
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve([{ _id: THEATRE_ID, city: { cityName: "Bengaluru" } }]),
    };
    Theatre.find.mockReturnValue(populateOwnerQuery);
    const res = createMockResponse();

    await controller.getTheatres({ userId: USER_ID }, res, jest.fn());

    expect(populateOwnerQuery.populate).toHaveBeenCalledWith({
      path: "owner",
      select: "-password",
    });
    expect(populateOwnerQuery.populate).toHaveBeenCalledWith("city", "cityName state country isActive");
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
