const crypto = require("crypto");
const mongoose = require("mongoose");
const { createMockResponse } = require("../helpers/mockExpress");

const TEST_SECRET = "test_razorpay_secret";
const USER_ID = new mongoose.Types.ObjectId().toString();
const SHOW_ID = new mongoose.Types.ObjectId().toString();
const THEATRE_ID = new mongoose.Types.ObjectId().toString();
const SCREEN_ID = new mongoose.Types.ObjectId().toString();
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

  const session = {
    withTransaction: jest.fn(async (callback) => callback()),
    endSession: jest.fn().mockResolvedValue(undefined),
  };

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
    Object.assign(this, { _id: "booking-1" }, payload);
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

  const showSeatRepository = {
    findByShow: jest.fn(),
    findAvailabilityByShow: jest.fn(),
    findByShowAndStatus: jest.fn(),
    countByShow: jest.fn().mockResolvedValue(0),
    findByShowAndSeat: jest.fn(),
    findByShowAndSeatNumbers: jest.fn().mockResolvedValue([]),
    markSeatsBooked: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    insertMany: jest.fn(),
    deleteByShow: jest.fn(),
  };

  const actualMongoose = jest.requireActual("mongoose");
  const mongooseMock = {
    ...actualMongoose,
    startSession: jest.fn().mockResolvedValue(session),
  };

  jest.doMock("mongoose", () => mongooseMock);
  jest.doMock("razorpay", () => jest.fn(() => razorpayInstance));
  jest.doMock("../../models/bookingSchema", () => Booking);
  jest.doMock("../../models/showSchema", () => Show);
  jest.doMock("../../models/theatreSchema", () => Theatre);
  jest.doMock("../../models/userSchema", () => User);
  jest.doMock("../../repositories/showSeatRepository", () => showSeatRepository);
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
    showSeatRepository,
    mongooseMock,
    session,
    pdf: require("../../utils/ticket-pdf"),
    email: require("../../utils/email"),
  };
};

const validShow = (ticketPrice = 200, overrides = {}) => ({
  _id: SHOW_ID,
  ticketPrice,
  bookedSeats: [],
  movie: { movieName: "Interstellar", poster: "poster.jpg" },
  theatre: { _id: THEATRE_ID, name: "PVR", address: "Forum" },
  ...overrides,
});

const initializedShow = (overrides = {}) => ({
  ...validShow(overrides.ticketPrice || 200),
  screen: {
    _id: SCREEN_ID,
    capacity: overrides.capacity || 2,
    name: "Screen 1",
    screenNumber: 1,
  },
  ...overrides,
});

const showSeatDocs = (overrides = {}) => ([
  { _id: "show-seat-a1", seatNumber: "A1", seatType: overrides.A1Type || "STANDARD", status: overrides.A1 || "AVAILABLE" },
  { _id: "show-seat-a2", seatNumber: "A2", seatType: overrides.A2Type || "STANDARD", status: overrides.A2 || "AVAILABLE" },
]);

const mixedShowSeatDocs = () => ([
  { _id: "show-seat-a1", seatNumber: "A1", seatType: "STANDARD", status: "AVAILABLE" },
  { _id: "show-seat-j5", seatNumber: "J5", seatType: "PREMIUM", status: "AVAILABLE" },
  { _id: "show-seat-r2", seatNumber: "R2", seatType: "RECLINER", status: "AVAILABLE" },
]);

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

  test("rejects initialized ShowSeat conflicts before Razorpay order creation", async () => {
    const { controller, razorpayInstance, Show, showSeatRepository } = loadController();
    Show.findById.mockResolvedValue(initializedShow());
    showSeatRepository.countByShow.mockResolvedValue(2);
    showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs({ A2: "BOOKED" }));
    const res = createMockResponse();

    await controller.createOrder(
      { userId: USER_ID, body: { showId: SHOW_ID, seats: ["A1", "A2"], feePerTicket: 20 } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(razorpayInstance.orders.create).not.toHaveBeenCalled();
  });

  test.each([
    ["STANDARD", { A1Type: "STANDARD", A2Type: "STANDARD" }, 34720, 300],
    ["PREMIUM", { A1Type: "PREMIUM", A2Type: "PREMIUM" }, 48720, 440],
    ["RECLINER", { A1Type: "RECLINER", A2Type: "RECLINER" }, 68720, 640],
  ])("uses explicit %s ShowSeat pricing for initialized Razorpay order creation", async (
    _seatType,
    seatOverrides,
    expectedPaise,
    expectedTicketAmount,
  ) => {
    const { controller, razorpayInstance, Show, showSeatRepository } = loadController();
    Show.findById.mockResolvedValue(initializedShow({
      ticketPricing: {
        STANDARD: 150,
        PREMIUM: 220,
        RECLINER: 320,
      },
    }));
    showSeatRepository.countByShow.mockResolvedValue(2);
    showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs(seatOverrides));
    razorpayInstance.orders.create.mockResolvedValue({ id: "order_1", amount: expectedPaise });
    const res = createMockResponse();

    await controller.createOrder(
      {
        userId: USER_ID,
        body: {
          showId: SHOW_ID,
          seats: ["A1", "A2"],
          feePerTicket: 20,
          price: 1,
          amount: 1,
        },
      },
      res,
      jest.fn(),
    );

    expect(razorpayInstance.orders.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: expectedPaise,
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ticketAmount: expectedTicketAmount,
        totalAmount: expectedPaise / 100,
      }),
    }));
  });

  test("uses mixed ShowSeat pricing and preserves selected seat order in createOrder response", async () => {
    const { controller, razorpayInstance, Show, showSeatRepository } = loadController();
    Show.findById.mockResolvedValue(initializedShow({
      capacity: 3,
      ticketPricing: {
        STANDARD: 150,
        PREMIUM: 220,
        RECLINER: 320,
      },
    }));
    showSeatRepository.countByShow.mockResolvedValue(3);
    showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue([
      mixedShowSeatDocs()[2],
      mixedShowSeatDocs()[0],
      mixedShowSeatDocs()[1],
    ]);
    razorpayInstance.orders.create.mockResolvedValue({ id: "order_1", amount: 76080 });
    const res = createMockResponse();

    await controller.createOrder(
      {
        userId: USER_ID,
        body: {
          showId: SHOW_ID,
          seats: ["A1", "J5", "R2"],
          feePerTicket: 20,
          seatPricing: [{ seatNumber: "A1", seatType: "STANDARD", price: 1 }],
        },
      },
      res,
      jest.fn(),
    );

    expect(razorpayInstance.orders.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 76080,
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ticketAmount: 690,
        convenienceFee: 70.8,
        totalAmount: 760.8,
        seatPricing: [
          { seatNumber: "A1", seatType: "STANDARD", price: 150 },
          { seatNumber: "J5", seatType: "PREMIUM", price: 220 },
          { seatNumber: "R2", seatType: "RECLINER", price: 320 },
        ],
      }),
    }));
  });

  test("missing initialized price category falls back to Show ticketPrice", async () => {
    const { controller, razorpayInstance, Show, showSeatRepository } = loadController();
    Show.findById.mockResolvedValue(initializedShow({
      ticketPrice: 175,
      ticketPricing: {
        STANDARD: 150,
      },
    }));
    showSeatRepository.countByShow.mockResolvedValue(2);
    showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs({
      A1Type: "PREMIUM",
      A2Type: "RECLINER",
    }));
    razorpayInstance.orders.create.mockResolvedValue({ id: "order_1", amount: 39720 });
    const res = createMockResponse();

    await controller.createOrder(
      { userId: USER_ID, body: { showId: SHOW_ID, seats: ["A1", "A2"], feePerTicket: 20 } },
      res,
      jest.fn(),
    );

    expect(razorpayInstance.orders.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 39720,
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ticketAmount: 350,
        seatPricing: [
          { seatNumber: "A1", seatType: "PREMIUM", price: 175 },
          { seatNumber: "A2", seatType: "RECLINER", price: 175 },
        ],
      }),
    }));
  });

  test("legacy Show flat pricing remains unchanged and includes fallback seatPricing", async () => {
    const { controller, razorpayInstance, Show, showSeatRepository } = loadController();
    Show.findById.mockResolvedValue(validShow(200));
    razorpayInstance.orders.create.mockResolvedValue({ id: "order_1", amount: 44720 });
    const res = createMockResponse();

    await controller.createOrder(
      { userId: USER_ID, body: { showId: SHOW_ID, seats: ["A1", "A2"], feePerTicket: 20 } },
      res,
      jest.fn(),
    );

    expect(showSeatRepository.findByShowAndSeatNumbers).not.toHaveBeenCalled();
    expect(razorpayInstance.orders.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 44720,
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ticketAmount: 400,
        seatPricing: [
          { seatNumber: "A1", seatType: "STANDARD", price: 200 },
          { seatNumber: "A2", seatType: "STANDARD", price: 200 },
        ],
      }),
    }));
  });

  test("rejects duplicate normalized seats before Razorpay order creation", async () => {
    const { controller, razorpayInstance } = loadController();
    const res = createMockResponse();

    await controller.createOrder(
      { userId: USER_ID, body: { showId: SHOW_ID, seats: ["a1", "A1"], feePerTicket: 20 } },
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
      ticketAmount: 400,
      seatPricing: [
        { seatNumber: "A1", seatType: "STANDARD", price: 200 },
        { seatNumber: "A2", seatType: "STANDARD", price: 200 },
      ],
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

  test("books initialized ShowSeats transactionally after payment validation", async () => {
    const ctx = arrangeValidBooking({ showDocument: initializedShow() });
    ctx.showSeatRepository.countByShow.mockResolvedValue(2);
    ctx.showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs());
    ctx.showSeatRepository.markSeatsBooked.mockResolvedValue({ modifiedCount: 2 });
    const req = { userId: USER_ID, body: bookingPayload({ seats: [" a1 ", "A2"] }) };
    const res = createMockResponse();

    await ctx.controller.bookSeat(req, res, jest.fn());

    expect(ctx.mongooseMock.startSession).toHaveBeenCalledTimes(1);
    expect(ctx.session.withTransaction).toHaveBeenCalledTimes(1);
    expect(ctx.Show.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: SHOW_ID, bookedSeats: { $nin: ["A1", "A2"] } },
      { $push: { bookedSeats: { $each: ["A1", "A2"] } } },
      { returnDocument: "after", session: ctx.session },
    );
    expect(ctx.showSeatRepository.markSeatsBooked).toHaveBeenCalledWith(
      expect.objectContaining({
        showId: SHOW_ID,
        seatNumbers: ["A1", "A2"],
        bookingId: expect.anything(),
      }),
      { session: ctx.session },
    );
    expect(ctx.Show.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: "Booking Successful",
    }));
  });

  test("authoritative mixed subtotal is recomputed and persisted for initialized booking", async () => {
    const ctx = arrangeValidBooking({
      amount: 41720,
      showDocument: initializedShow({
        ticketPricing: {
          STANDARD: 150,
          PREMIUM: 220,
        },
      }),
    });
    ctx.showSeatRepository.countByShow.mockResolvedValue(2);
    ctx.showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs({
      A1Type: "STANDARD",
      A2Type: "PREMIUM",
    }));
    ctx.showSeatRepository.markSeatsBooked.mockResolvedValue({ modifiedCount: 2 });
    const req = {
      userId: USER_ID,
      body: bookingPayload({
        seats: ["A1", "A2"],
        amount: 1,
        convenienceFee: 1,
        seatPricing: [{ seatNumber: "A1", seatType: "STANDARD", price: 1 }],
      }),
    };
    const res = createMockResponse();

    await ctx.controller.bookSeat(req, res, jest.fn());

    expect(ctx.Booking).toHaveBeenCalledWith(expect.objectContaining({
      seats: ["A1", "A2"],
      ticketAmount: 370,
      seatPricing: [
        { seatNumber: "A1", seatType: "STANDARD", price: 150 },
        { seatNumber: "A2", seatType: "PREMIUM", price: 220 },
      ],
      amount: 417.2,
      convenienceFee: 47.2,
    }));
    expect(ctx.Show.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: SHOW_ID, bookedSeats: { $nin: ["A1", "A2"] } },
      { $push: { bookedSeats: { $each: ["A1", "A2"] } } },
      { returnDocument: "after", session: ctx.session },
    );
    expect(ctx.showSeatRepository.markSeatsBooked).toHaveBeenCalledWith(
      expect.objectContaining({
        showId: SHOW_ID,
        seatNumbers: ["A1", "A2"],
      }),
      { session: ctx.session },
    );
  });

  test("price change after Razorpay order creation rejects stale paid amount", async () => {
    const ctx = arrangeValidBooking({
      amount: 44720,
      showDocument: initializedShow({
        ticketPricing: {
          STANDARD: 250,
        },
      }),
    });
    ctx.showSeatRepository.countByShow.mockResolvedValue(2);
    ctx.showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs());
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Payment amount does not match booking amount",
    });
    expect(ctx.Booking).not.toHaveBeenCalled();
    expect(ctx.Show.findOneAndUpdate).not.toHaveBeenCalled();
    expect(ctx.showSeatRepository.markSeatsBooked).not.toHaveBeenCalled();
  });

  test("payment amount mismatch is rejected before booking or seat writes persist", async () => {
    const ctx = arrangeValidBooking({
      amount: 100,
      showDocument: initializedShow({
        ticketPricing: {
          STANDARD: 150,
          PREMIUM: 220,
        },
      }),
    });
    ctx.showSeatRepository.countByShow.mockResolvedValue(2);
    ctx.showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs({
      A1Type: "STANDARD",
      A2Type: "PREMIUM",
    }));
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ctx.Booking).not.toHaveBeenCalled();
    expect(ctx.Show.findOneAndUpdate).not.toHaveBeenCalled();
    expect(ctx.showSeatRepository.markSeatsBooked).not.toHaveBeenCalled();
  });

  test("legacy Show booking still succeeds with flat ticketAmount snapshot", async () => {
    const ctx = arrangeValidBooking({ showDocument: validShow(200) });
    const req = { userId: USER_ID, body: bookingPayload({ seats: ["A1", "A2"] }) };
    const res = createMockResponse();

    await ctx.controller.bookSeat(req, res, jest.fn());

    expect(ctx.Booking).toHaveBeenCalledWith(expect.objectContaining({
      seats: ["A1", "A2"],
      ticketAmount: 400,
      seatPricing: [
        { seatNumber: "A1", seatType: "STANDARD", price: 200 },
        { seatNumber: "A2", seatType: "STANDARD", price: 200 },
      ],
      amount: 447.2,
    }));
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("rejects concurrent initialized ShowSeat booking conflicts without legacy rollback", async () => {
    const ctx = arrangeValidBooking({ showDocument: initializedShow() });
    ctx.showSeatRepository.countByShow.mockResolvedValue(2);
    ctx.showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs());
    ctx.showSeatRepository.markSeatsBooked.mockResolvedValue({ modifiedCount: 1 });
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(ctx.session.withTransaction).toHaveBeenCalledTimes(1);
    expect(ctx.Show.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: "Some seats were already booked. Please choose different seats.",
    }));
  });

  test("rejects initialized booking when ShowSeat inventory is incomplete", async () => {
    const ctx = arrangeValidBooking({ showDocument: initializedShow({ capacity: 3 }) });
    ctx.showSeatRepository.countByShow.mockResolvedValue(2);
    const res = createMockResponse();

    await ctx.controller.bookSeat({ userId: USER_ID, body: bookingPayload() }, res, jest.fn());

    expect(ctx.mongooseMock.startSession).not.toHaveBeenCalled();
    expect(ctx.Show.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "ShowSeat inventory is not ready for this show",
      code: "SHOWSEAT_INVENTORY_NOT_READY",
    });
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

  test("rejects duplicate normalized booking seats before gateway fetches", async () => {
    const ctx = arrangeValidBooking();
    const res = createMockResponse();

    await ctx.controller.bookSeat(
      { userId: USER_ID, body: bookingPayload({ seats: ["a1", "A1"] }) },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ctx.razorpayInstance.orders.fetch).not.toHaveBeenCalled();
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

  test("validates initialized ShowSeat availability against ShowSeat status and legacy bookedSeats", async () => {
    const { controller, Show, showSeatRepository } = loadController();
    Show.findById.mockReturnValue(createPopulateQuery(initializedShow({ bookedSeats: ["A1"] })));
    showSeatRepository.countByShow.mockResolvedValue(2);
    showSeatRepository.findByShowAndSeatNumbers.mockResolvedValue(showSeatDocs({ A2: "BOOKED" }));
    const res = createMockResponse();

    await controller.validateSeats(
      { body: { showId: SHOW_ID, seats: ["A1", "A2"] } },
      res,
      jest.fn(),
    );

    expect(showSeatRepository.findByShowAndSeatNumbers).toHaveBeenCalledWith(
      SHOW_ID,
      ["A1", "A2"],
      {},
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      data: expect.objectContaining({ unavailableSeats: ["A1", "A2"] }),
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

describe("BookingController partner booking and revenue compatibility", () => {
  test("Theatre bookings include historical legacy and screen-aware Show bookings", async () => {
    const { controller, Booking, Show, Theatre } = loadController();
    const screenAwareBooking = {
      _id: "booking-screen-aware",
      user: { name: "Screen User", email: "screen@example.com", phone: "9999999999" },
      show: {
        movie: { movieName: "Dune", poster: "poster.jpg" },
        theatre: { _id: THEATRE_ID, name: "INOX" },
        screen: { name: "Screen 2", screenNumber: 2, capacity: 210 },
        date: "2026-09-03",
        time: "14:30",
        ticketPrice: 250,
      },
      seats: ["A1"],
      amount: 267.7,
      convenienceFee: 17.7,
      gstPercent: 18,
      ticketStatus: "Confirmed",
      seatType: "Standard",
      bookingId: "BMS0001",
      createdAt: new Date("2026-09-03T10:00:00Z"),
      paymentMethod: "Razorpay",
    };
    const legacyBooking = {
      _id: "booking-legacy",
      user: { name: "Legacy User", email: "legacy@example.com", phone: "8888888888" },
      show: {
        movie: { movieName: "Interstellar", poster: "poster2.jpg" },
        theatre: { _id: THEATRE_ID, name: "INOX" },
        date: "2026-08-20",
        time: "10:15",
        ticketPrice: 200,
      },
      seats: ["B1", "B2"],
      amount: 435.4,
      convenienceFee: 35.4,
      gstPercent: 18,
      ticketStatus: "Confirmed",
      seatType: "Standard",
      bookingId: "BMS0002",
      createdAt: new Date("2026-08-20T10:00:00Z"),
      paymentMethod: "Razorpay",
    };

    Theatre.findById.mockReturnValue(createSelectableQuery({ _id: THEATRE_ID, owner: USER_ID }));
    Show.find.mockReturnValue(createSelectableQuery([{ _id: "show-1" }, { _id: "show-2" }]));
    Booking.find.mockReturnValue(createSortPopulateQuery([screenAwareBooking, legacyBooking]));
    const res = createMockResponse();

    await controller.getBookingsByTheatre(
      {
        params: { theatreId: THEATRE_ID },
        userId: USER_ID,
        user: { role: "partner" },
      },
      res,
      jest.fn(),
    );

    expect(Show.find).toHaveBeenCalledWith({ theatre: THEATRE_ID });
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [
        expect.objectContaining({
          bookingId: "BMS0001",
          screenName: "Screen 2 / Screen 2",
          amount: 267.7,
        }),
        expect.objectContaining({
          bookingId: "BMS0002",
          screenName: null,
          amount: 435.4,
        }),
      ],
    }));
  });

  test("Revenue aggregation keeps legacy and screen-aware booking revenue by Theatre", async () => {
    const { controller, Booking, Show, Theatre } = loadController();
    const bookings = [
      {
        amount: 267.7,
        seats: ["A1"],
        createdAt: new Date(),
        show: {
          theatre: { _id: THEATRE_ID, name: "INOX" },
          screen: { name: "Screen 2", screenNumber: 2 },
        },
      },
      {
        amount: 435.4,
        seats: ["B1", "B2"],
        createdAt: new Date(),
        show: {
          theatre: { _id: THEATRE_ID, name: "INOX" },
        },
      },
    ];

    Theatre.find.mockReturnValue(createSelectableQuery([{ _id: THEATRE_ID, name: "INOX" }]));
    Show.find.mockReturnValue(createSelectableQuery([{ _id: "show-1" }, { _id: "show-2" }]));
    Booking.find.mockReturnValue(createPopulateQuery(bookings));
    const res = createMockResponse();

    await controller.getRevenueByOwner(
      {
        params: { ownerId: USER_ID },
        userId: USER_ID,
        user: { role: "partner" },
      },
      res,
      jest.fn(),
    );

    expect(Show.find).toHaveBeenCalledWith({ theatre: { $in: [THEATRE_ID] } });
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        summary: expect.objectContaining({
          totalRevenue: 703.1,
          totalBookings: 2,
          totalTickets: 3,
        }),
        revenueByTheatre: [
          expect.objectContaining({
            theatreId: THEATRE_ID,
            theatreName: "INOX",
            revenue: 703.1,
            bookings: 2,
            tickets: 3,
          }),
        ],
      }),
    }));
  });

  test("Partner cannot fetch bookings or revenue for another owner", async () => {
    const { controller, Booking, Show, Theatre } = loadController();
    const res = createMockResponse();

    Theatre.findById.mockReturnValue(createSelectableQuery({ _id: THEATRE_ID, owner: OTHER_USER_ID }));

    await controller.getBookingsByTheatre(
      {
        params: { theatreId: THEATRE_ID },
        userId: USER_ID,
        user: { role: "partner" },
      },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Show.find).not.toHaveBeenCalled();
    expect(Booking.find).not.toHaveBeenCalled();

    const revenueRes = createMockResponse();
    await controller.getRevenueByOwner(
      {
        params: { ownerId: OTHER_USER_ID },
        userId: USER_ID,
        user: { role: "partner" },
      },
      revenueRes,
      jest.fn(),
    );

    expect(revenueRes.status).toHaveBeenCalledWith(403);
  });
});
