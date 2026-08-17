const crypto = require("crypto");
const mongoose = require("mongoose");
const { createMockResponse } = require("../helpers/mockExpress");

const TEST_SECRET = "test_razorpay_secret";
const USER_ID = new mongoose.Types.ObjectId().toString();
const SHOW_ID = new mongoose.Types.ObjectId().toString();
const THEATRE_ID = new mongoose.Types.ObjectId().toString();
const OTHER_USER_ID = new mongoose.Types.ObjectId().toString();

const createSignature = (orderId, transactionId) => crypto
  .createHmac("sha256", TEST_SECRET)
  .update(`${orderId}|${transactionId}`)
  .digest("hex");

const createSelectableQuery = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const createPopulateQuery = (value) => ({
  populate: jest.fn().mockResolvedValue(value),
});

const createSortPopulateQuery = (value) => {
  const query = {
    sort: jest.fn(() => query),
    populate: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return query;
};

const loadController = () => {
  jest.resetModules();
  process.env.RAZORPAY_KEY_SECRET = TEST_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";

  const razorpayInstance = {
    orders: {
      create: jest.fn(),
      fetch: jest.fn(),
    },
    payments: {
      fetch: jest.fn(),
    },
  };

  const Booking = jest.fn(function BookingModel(payload) {
    Object.assign(this, payload);
    this.save = Booking.saveMock || jest.fn().mockResolvedValue(this);
    this.toObject = () => ({ ...this });
  });
  Booking.findOne = jest.fn();
  Booking.find = jest.fn();
  Booking.saveMock = null;

  const Show = {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
  };

  const Theatre = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  const User = {
    findById: jest.fn(),
  };

  jest.doMock("razorpay", () => jest.fn(() => razorpayInstance));
  jest.doMock("../../models/bookingSchema", () => Booking);
  jest.doMock("../../models/showSchema", () => Show);
  jest.doMock("../../models/theatreSchema", () => Theatre);
  jest.doMock("../../models/userSchema", () => User);
  jest.doMock("../../utils/idGenerator", () => ({ generateBookingId: jest.fn(() => "BMS1234") }));
  jest.doMock("../../utils/ticket-pdf", () => ({ generateTicketPDF: jest.fn().mockResolvedValue(Buffer.from("pdf")) }));
  jest.doMock("../../utils/email", () => ({ sendTicketEmail: jest.fn().mockResolvedValue({ messageId: "email-1" }) }));

  const controller = require("../../controllers/BookingController");

  return {
    controller,
    razorpayInstance,
    Booking,
    Show,
    Theatre,
    User,
    pdf: require("../../utils/ticket-pdf"),
    email: require("../../utils/email"),
  };
};

const validShow = (ticketPrice = 200) => ({
  _id: SHOW_ID,
  ticketPrice,
  bookedSeats: [],
  movie: { movieName: "Interstellar", poster: "poster.jpg" },
  theatre: { _id: THEATRE_ID, name: "PVR", address: "Forum" },
});

const validRazorpayOrder = (amount = 44720, feePerTicket = 20) => ({
  id: "order_1",
  amount,
  receipt: "receipt_1",
  notes: {
    userId: USER_ID,
    showId: SHOW_ID,
    seatCount: "2",
    feePerTicket: String(feePerTicket),
  },
});

const validRazorpayPayment = (amount = 44720) => ({
  id: "pay_1",
  order_id: "order_1",
  amount,
  status: "captured",
});

const bookingPayload = (overrides = {}) => {
  const orderId = overrides.orderId || "order_1";
  const transactionId = overrides.transactionId || "pay_1";

  return {
    transactionId,
    orderId,
    signature: overrides.signature || createSignature(orderId, transactionId),
    seats: overrides.seats || ["A1", "A2"],
    show: overrides.show || SHOW_ID,
    seatType: "Standard",
    gstPercent: 18,
    paymentMethod: "Razorpay",
    receipt: "receipt_1",
    ...overrides,
  };
};

describe("BookingController pricing and Razorpay order creation", () => {
  test.each([
    [15, 43540, 30, 5.4, 35.4, 435.4],
    [20, 44720, 40, 7.2, 47.2, 447.2],
  ])("accepts feePerTicket %s and uses Show ticket price for Razorpay amount", async (
    feePerTicket,
    expectedPaise,
    expectedBaseFee,
    expectedGst,
    expectedConvenienceFee,
    expectedTotal,
  ) => {
    const { controller, razorpayInstance, Show } = loadController();
    Show.findById.mockResolvedValue(validShow(200));
    razorpayInstance.orders.create.mockResolvedValue({ id: "order_1", amount: expectedPaise });

    const req = {
      userId: USER_ID,
      body: {
        showId: SHOW_ID,
        seats: ["A1", "A2"],
        feePerTicket,
        amount: 1,
      },
    };
    const res = createMockResponse();

    await controller.createOrder(req, res, jest.fn());

    expect(razorpayInstance.orders.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: expectedPaise,
      notes: expect.objectContaining({
        userId: USER_ID,
        showId: SHOW_ID,
        seatCount: "2",
        feePerTicket: String(feePerTicket),
      }),
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        ticketAmount: 400,
        feePerTicket,
        gst: expectedGst,
        convenienceFee: expectedConvenienceFee,
        totalAmount: expectedTotal,
      }),
    }));
    expect(expectedBaseFee).toBe(feePerTicket * 2);
  });

  test.each([14, 21, 15.5, Number.NaN, Infinity])("rejects invalid feePerTicket %s", async (feePerTicket) => {
    const { controller, razorpayInstance, Show } = loadController();
    Show.findById.mockResolvedValue(validShow());

    const req = {
      userId: USER_ID,
      body: { showId: SHOW_ID, seats: ["A1"], feePerTicket },
    };
    const res = createMockResponse();

    await controller.createOrder(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid convenience fee",
    });
    expect(razorpayInstance.orders.create).not.toHaveBeenCalled();
  });

  test("rejects invalid show id and missing seats before Razorpay order creation", async () => {
    const { controller, razorpayInstance } = loadController();
    const res = createMockResponse();

    await controller.createOrder(
      { userId: USER_ID, body: { showId: "bad-id", seats: [], feePerTicket: 15 } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(razorpayInstance.orders.create).not.toHaveBeenCalled();
  });
});

describe("BookingController booking persistence and payment validation", () => {
  const arrangeValidBooking = (overrides = {}) => {
    const ctx = loadController();
    const amount = overrides.amount ?? 44720;
    const feePerTicket = overrides.feePerTicket ?? 20;
    const show = overrides.showDocument || validShow(200);
    const reservedShow = {
      ...show,
      toObject: () => show,
    };

    ctx.razorpayInstance.orders.fetch.mockResolvedValue(validRazorpayOrder(amount, feePerTicket));
    ctx.razorpayInstance.payments.fetch.mockResolvedValue({
      ...validRazorpayPayment(amount),
      status: overrides.paymentStatus || "captured",
      order_id: overrides.paymentOrderId || "order_1",
    });
    ctx.Show.findById.mockResolvedValue(show);
    ctx.Show.findOneAndUpdate.mockReturnValue(createPopulateQuery(reservedShow));
    ctx.Booking.findOne.mockReturnValue(createSelectableQuery(overrides.existingBooking || null));
    ctx.User.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ name: "User", email: "user@example.com" }),
    });

    return ctx;
  };

  test("accepts captured valid payment and creates booking after atomic seat reservation", async () => {
    const ctx = arrangeValidBooking();
    const req = { userId: USER_ID, body: bookingPayload() };
    const res = createMockResponse();

    await ctx.controller.bookSeat(req, res, jest.fn());

    expect(ctx.Show.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: SHOW_ID, bookedSeats: { $nin: ["A1", "A2"] } },
      { $push: { bookedSeats: { $each: ["A1", "A2"] } } },
      { returnDocument: "after" },
    );
    expect(ctx.Booking).toHaveBeenCalledWith(expect.objectContaining({
      show: SHOW_ID,
      user: USER_ID,
      transactionId: "pay_1",
      orderId: "order_1",
      amount: 447.2,
      convenienceFee: 47.2,
    }));
    expect(ctx.pdf.generateTicketPDF).toHaveBeenCalled();
    expect(ctx.email.sendTicketEmail).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: "Booking Successful",
    }));
  });

  test("rejects invalid Razorpay signature before gateway fetches", async () => {
    const ctx = arrangeValidBooking();
    const res = createMockResponse();

    await ctx.controller.bookSeat(
      { userId: USER_ID, body: bookingPayload({ signature: "bad-signature" }) },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid payment" });
    expect(ctx.razorpayInstance.orders.fetch).not.toHaveBeenCalled();
  });

  test("rejects payment amount mismatch", async () => {
    const ctx = arrangeValidBooking({ amount: 100 });
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Payment amount does not match booking amount",
    });
  });

  test("rejects non-captured Razorpay payment", async () => {
    const ctx = arrangeValidBooking({ paymentStatus: "authorized" });
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Payment is not captured",
    });
  });

  test.each([
    [{ transactionId: "pay_1" }, "transactionId"],
    [{ orderId: "order_1" }, "orderId"],
  ])("rejects reused %s before reserving seats", async (existingBooking) => {
    const ctx = arrangeValidBooking({ existingBooking });
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Payment has already been used for a booking",
    });
    expect(ctx.Show.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("rejects unavailable seats when atomic reservation fails", async () => {
    const ctx = arrangeValidBooking();
    ctx.Show.findOneAndUpdate.mockReturnValue(createPopulateQuery(null));
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Some seats were already booked. Please choose different seats.",
    });
  });

  test("rolls back reserved seats if booking save fails", async () => {
    const ctx = arrangeValidBooking();
    const saveError = new Error("save failed");
    ctx.Booking.saveMock = jest.fn().mockRejectedValue(saveError);
    const next = jest.fn();
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, next);

    expect(ctx.Show.findByIdAndUpdate).toHaveBeenCalledWith(
      SHOW_ID,
      { $pull: { bookedSeats: { $in: ["A1", "A2"] } } },
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(saveError);
  });

  test("handles duplicate-key race during booking save after rollback", async () => {
    const ctx = arrangeValidBooking();
    const duplicateKeyError = new Error("duplicate");
    duplicateKeyError.code = 11000;
    ctx.Booking.saveMock = jest.fn().mockRejectedValue(duplicateKeyError);
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(ctx.Show.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Payment has already been used for a booking",
    });
  });

  test("rejects invalid show and empty seat request", async () => {
    const { controller } = loadController();
    const res = createMockResponse();

    await controller.bookSeat(
      { userId: USER_ID, body: bookingPayload({ show: "bad-id", seats: [] }) },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Valid show id and seats array are required",
    });
  });
});

describe("BookingController seat validation and history", () => {
  test("validates available seats", async () => {
    const { controller, Show } = loadController();
    Show.findById.mockReturnValue(createPopulateQuery({
      _id: SHOW_ID,
      bookedSeats: ["B1"],
      movie: { movieName: "Dune" },
      theatre: { name: "INOX" },
      date: "2026-08-17",
      time: "18:00",
      ticketPrice: 250,
    }));
    const res = createMockResponse();

    await controller.validateSeats(
      { body: { showId: SHOW_ID, seats: ["A1", "A2"] } },
      res,
      jest.fn(),
    );

    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ availableSeats: ["A1", "A2"] }),
    }));
  });

  test("rejects already booked seats during validation", async () => {
    const { controller, Show } = loadController();
    Show.findById.mockReturnValue(createPopulateQuery({ bookedSeats: ["A1"], movie: {}, theatre: {} }));
    const res = createMockResponse();

    await controller.validateSeats(
      { body: { showId: SHOW_ID, seats: ["A1", "A2"] } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      data: expect.objectContaining({ unavailableSeats: ["A1"] }),
    }));
  });

  test("allows user to fetch own booking history", async () => {
    const { controller, Booking } = loadController();
    Booking.find.mockReturnValue(createSortPopulateQuery([
      {
        show: {
          movie: { movieName: "Dune", poster: "poster.jpg" },
          theatre: { name: "INOX" },
          date: "2026-08-17",
          time: "18:00",
          ticketPrice: 250,
        },
        seats: ["A1"],
        convenienceFee: 17.7,
        gstPercent: 18,
        ticketStatus: "Confirmed",
        seatType: "Standard",
        bookingId: "BMS1234",
        createdAt: new Date("2026-08-17T10:00:00Z"),
        paymentMethod: "Razorpay",
      },
    ]));
    const res = createMockResponse();

    await controller.getBookingsByUserId(
      { userId: USER_ID, params: { id: USER_ID } },
      res,
      jest.fn(),
    );

    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [expect.objectContaining({ movieTitle: "Dune", bookingId: "BMS1234" })],
    }));
  });

  test("denies manipulated booking history URL for another user", async () => {
    const { controller, Booking } = loadController();
    const res = createMockResponse();

    await controller.getBookingsByUserId(
      { userId: USER_ID, params: { id: OTHER_USER_ID } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Access denied" });
    expect(Booking.find).not.toHaveBeenCalled();
  });
});
