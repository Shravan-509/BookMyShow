const Booking = require("../models/bookingSchema");
const Show = require("../models/showSchema");
const Theatre = require("../models/theatreSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { generateBookingId } = require("../utils/idGenerator");
const showSeatService = require("../services/showSeatService");

const path = require("path")
const User = require("../models/userSchema")
const { generateTicketPDF } = require("../utils/ticket-pdf")
const { sendTicketEmail } = require("../utils/email")
const showPricingService = require("../services/showPricingService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const validateSeatInput = (seats) => (
    (() => {
        try {
            showSeatService.normalizeSeatSelection(seats);
            return true;
        } catch (error) {
            return false;
        }
    })()
)

const validateFeePerTicket = (feePerTicket) => (
    Number.isFinite(feePerTicket)
    && Number.isInteger(feePerTicket)
    && feePerTicket >= 15
    && feePerTicket <= 20
)

const calculateFeesForTicketAmount = (ticketAmount, seatCount, feePerTicket) => {
    const authoritativeTicketAmount = Number(ticketAmount)

    if (!Number.isFinite(authoritativeTicketAmount) || authoritativeTicketAmount < 0) {
        throw new Error("Invalid ticket amount")
    }

    const roundedTicketAmount = Number(authoritativeTicketAmount.toFixed(2))
    const baseConvenienceFee = feePerTicket * seatCount
    const gst = Number((baseConvenienceFee * 0.18).toFixed(2))
    const convenienceFee = Number((baseConvenienceFee + gst).toFixed(2))
    const totalAmount = Number((roundedTicketAmount + convenienceFee).toFixed(2))
    const totalAmountInPaise = Math.round(totalAmount * 100)

    return {
        ticketAmount: roundedTicketAmount,
        feePerTicket,
        gst,
        convenienceFee,
        totalAmount,
        totalAmountInPaise,
    }
}

const buildLegacySeatPricing = (show, seats) => {
    const ticketPrice = Number(show?.ticketPrice)

    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
        throw new Error("Invalid show ticket price")
    }

    return {
        ticketAmount: Number((ticketPrice * seats.length).toFixed(2)),
        seatPricing: seats.map((seatNumber) => ({
            seatNumber,
            seatType: "STANDARD",
            price: ticketPrice,
        })),
    }
}

const orderShowSeatsBySelection = (seats, showSeats = []) => {
    const showSeatsByLabel = new Map(
        showSeats.map((showSeat) => [
            showSeatService.normalizeSeatLabel(showSeat.seatNumber),
            showSeat,
        ])
    )

    return seats.map((seatNumber) => showSeatsByLabel.get(showSeatService.normalizeSeatLabel(seatNumber)))
}

const calculateBookingPricing = ({ show, seats, feePerTicket, showSeats = null }) => {
    const ticketPricing = Array.isArray(showSeats)
        ? showPricingService.buildSeatPricing(show, orderShowSeatsBySelection(seats, showSeats))
        : buildLegacySeatPricing(show, seats)
    const feePricing = calculateFeesForTicketAmount(
        ticketPricing.ticketAmount,
        seats.length,
        feePerTicket
    )

    return {
        ...feePricing,
        seatPricing: ticketPricing.seatPricing,
    }
}

const populateBookingDetails = (query) => query
    .populate({
        path: "show",
        populate: [
            {
                path: "movie",
                model: "movies",
            },
            {
                path: "theatre",
                model: "theatres",
            },
            {
                path: "screen",
                model: "Screen",
                select: "name screenNumber capacity theatre isActive",
            },
        ],
    })

const getScreenLabel = (screen) => {
    if (!screen) {
        return null
    }

    if (screen.name && screen.screenNumber) {
        return `${screen.name} / Screen ${screen.screenNumber}`
    }

    return screen.name || (screen.screenNumber ? `Screen ${screen.screenNumber}` : null)
}

const addCurrency = (amounts) => Number(
    amounts.reduce((sum, amount) => sum + Number(amount || 0), 0).toFixed(2)
)

const loadShowForBooking = async (showId, { includeDetails = false, session = null } = {}) => {
    let query = Show.findById(showId);

    if (query?.session && session) {
        query = query.session(session);
    }

    if (query?.populate) {
        const populateConfig = includeDetails
            ? [
                { path: "movie" },
                { path: "theatre" },
                { path: "screen", select: "name screenNumber capacity theatre isActive" },
            ]
            : { path: "screen", select: "capacity" };

        return query.populate(populateConfig);
    }

    return query;
};

const sendOperationalError = (res, error) => {
    const body = {
        success: false,
        message: error.message,
    };

    if (error.code) {
        body.code = error.code;
    }

    return res.status(error.statusCode || 500).json(body);
};

const sendSeatConflict = (res, error) => res.status(error.statusCode || 409).send({
    success: false,
    message: error.message,
    data: error.details,
});

const createBookingDocument = ({
    showId,
    userId,
    seats,
    seatType,
    transactionId,
    orderId,
    receipt,
    razorpayOrder,
    pricing,
    gstPercent,
    paymentMethod,
}) => new Booking({
    show: showId,
    user: userId,
    seats,
    seatType: seatType || "Standard",
    transactionId,
    orderId,
    receipt: razorpayOrder.receipt || receipt,
    bookingId: generateBookingId(),
    ticketAmount: pricing.ticketAmount,
    seatPricing: pricing.seatPricing,
    amount: pricing.totalAmount,
    convenienceFee: pricing.convenienceFee,
    gstPercent: gstPercent ?? 18,
    paymentMethod: paymentMethod || "N/A",
    ticketStatus: "Confirmed",
});

const sendTicketArtifacts = async ({ newBooking, reservedShow }) => {
    const userId = newBooking.user
    const userDoc = await User.findById(userId).lean()
    const toEmail = userDoc?.email
    let pdfBuffer = null

    try
    {
        pdfBuffer = await generateTicketPDF({
            booking: newBooking.toObject(),
            show: reservedShow.toObject(),
            movie: reservedShow.movie,
            theatre: reservedShow.theatre,
        })
    }
    catch (err)
    {
        // PDF should not block the booking; log and continue
        console.error("[ticket-pdf] Error generating PDF:", err.message)
    }

    if(toEmail)
    {
        try
        {
            await sendTicketEmail({
                name: userDoc.name,
                email: toEmail,
                booking: newBooking.toObject(),
                show: reservedShow.toObject(),
                movie: reservedShow.movie,
                theatre: reservedShow.theatre,
                pdfBuffer,
            })
        }
        catch (error)
        {
            console.error("[email] Error sending ticket email:", error.message)
        }
    }
};

const simplifyBooking = (booking, { includeUser = false } = {}) => {
    const show = booking.show
    const movie = show?.movie
    const theatre = show?.theatre
    const screen = show?.screen
    const user = booking.user
    const simplified = {
        _id: booking._id,
        movieTitle: movie?.movieName,
        theatreName: theatre?.name,
        screenName: getScreenLabel(screen),
        screenNumber: screen?.screenNumber,
        poster: movie?.poster,
        showDate: show?.date,
        showTime: show?.time,
        seats: booking.seats,
        ticketPrice: show?.ticketPrice,
        ticketAmount: booking?.ticketAmount,
        seatPricing: booking?.seatPricing,
        convenienceFee: booking?.convenienceFee,
        gstPercent: booking?.gstPercent,
        ticketStatus: booking?.ticketStatus,
        seatType: booking?.seatType,
        bookingId: booking?.bookingId,
        bookingTime: booking?.createdAt,
        paymentMethod: booking?.paymentMethod,
        amount: booking?.amount,
    }

    if (includeUser) {
        simplified.userName = user?.name
        simplified.userEmail = user?.email
        simplified.userPhone = user?.phone
    }

    return simplified
}

const validateSeats = async (req, res, next) => {
    try {
        const { showId, seats } = req.body

        if(!mongoose.Types.ObjectId.isValid(showId) || !validateSeatInput(seats))
        {
            return res.status(400).send({
                success: false,
                message: "Valid show id and seats array are required"
            })
        }

        const normalizedSeats = showSeatService.normalizeSeatSelection(seats)

        // Find the show and check seat availability
        const show = await loadShowForBooking(showId, { includeDetails: true })

        if(!show)
        {
            return res.status(404).send({
                success: false,
                message: "Show not found"
            })
        }

        const availability = await showSeatService.validateBookingSeatSelection(show, normalizedSeats)

        // All Seats are available
        res.send({
            success: true,
            message: "All selected seats are available",
            data: {
                availableSeats : availability.availableSeats,
                unavailableSeats: [],
                allBookedSeats: availability.allBookedSeats,
                show: {
                    id: show._id,
                    movie: show.movie.movieName,
                    theatre: show.theatre.name,
                    date: show.date,
                    time: show.time,
                    ticketPrice: show.ticketPrice
                }
            }
        })
    } catch (error) {
        if (error?.details?.unavailableSeats) {
            return sendSeatConflict(res, error)
        }

        if (error?.isOperational) {
            return sendOperationalError(res, error)
        }

        res.status(400)
        next(error)
    }
}


const createOrder = async (req, res, next) => {
    try {
        const { showId, seats } = req.body;
        const feePerTicket = Number(req.body.feePerTicket);

        if(!mongoose.Types.ObjectId.isValid(showId))
        {
            return res.status(400).json({
                success: false,
                message: "Valid show id is required"
            })
        }

        if(!validateSeatInput(seats))
        {
            return res.status(400).json({
                success: false,
                message: "Seats array is required"
            })
        }

        const normalizedSeats = showSeatService.normalizeSeatSelection(seats)

        if(!validateFeePerTicket(feePerTicket))
        {
            return res.status(400).json({
                success: false,
                message: "Invalid convenience fee"
            })
        }

        const show = await loadShowForBooking(showId)

        if(!show)
        {
            return res.status(404).json({
                success: false,
                message: "Show not found"
            })
        }

        const seatValidation = await showSeatService.validateBookingSeatSelection(show, normalizedSeats)

        const pricing = calculateBookingPricing({
            show,
            seats: normalizedSeats,
            feePerTicket,
            showSeats: seatValidation.mode === showSeatService.BOOKING_SEAT_VALIDATION_MODE.INITIALIZED
                ? seatValidation.showSeats
                : null,
        })

        const options = {
            amount: pricing.totalAmountInPaise,
            currency: "INR",
            receipt: "BMS_TICKET_" + new Date().getTime(),
            notes: {
                userId: req.userId.toString(),
                showId: show._id.toString(),
                seatCount: normalizedSeats.length.toString(),
                feePerTicket: feePerTicket.toString(),
            },
        }

        const order = await razorpay.orders.create(options);

        res.send({
            success: true,
            message: "Order Creation Successfull",
            data: {
                ...order,
                ticketAmount: pricing.ticketAmount,
                seatPricing: pricing.seatPricing,
                feePerTicket: pricing.feePerTicket,
                gst: pricing.gst,
                convenienceFee: pricing.convenienceFee,
                totalAmount: pricing.totalAmount,
            }
        });

    } catch (error) {
        if (error?.details?.unavailableSeats) {
            return sendSeatConflict(res, error)
        }

        if (error?.isOperational) {
            return sendOperationalError(res, error)
        }

        res.status(400);
        next(error);
    }
}


const bookSeat = async (req, res, next) => {
    try {
        const { 
            transactionId, 
            orderId, 
            signature,
            seats,
            show: showId,
            seatType,
            gstPercent,
            paymentMethod,
            receipt,
        } = req.body;
        
            if(!transactionId || !orderId || !signature)
            {
                return res.status(400).json({
                    success: false,
                    message: "Payment details are required",
                })
            }

            if(!mongoose.Types.ObjectId.isValid(showId) || !validateSeatInput(seats))
            {
                return res.status(400).json({
                    success: false,
                    message: "Valid show id and seats array are required",
                })
            }

            const normalizedSeats = showSeatService.normalizeSeatSelection(seats)
       
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + transactionId)
            .digest("hex");

            if (generatedSignature !== signature) 
            {
                return res.status(400).json({ success: false, message: "Invalid payment" })
            }

            const [razorpayOrder, razorpayPayment, show] = await Promise.all([
                razorpay.orders.fetch(orderId),
                razorpay.payments.fetch(transactionId),
                loadShowForBooking(showId),
            ])

            if(!show)
            {
                return res.status(404).json({
                    success: false,
                    message: "Show not found",
                })
            }

            if(razorpayPayment.order_id !== orderId)
            {
                return res.status(400).json({
                    success: false,
                    message: "Payment order mismatch",
                })
            }

            if(razorpayPayment.status !== "captured")
            {
                return res.status(400).json({
                    success: false,
                    message: "Payment is not captured",
                })
            }

            const orderNotes = razorpayOrder.notes || {}
            const feePerTicket = Number(orderNotes.feePerTicket)

            if(
                orderNotes.userId !== req.userId.toString()
                || orderNotes.showId !== showId.toString()
                || Number(orderNotes.seatCount) !== normalizedSeats.length
                || !validateFeePerTicket(feePerTicket)
            )
            {
                return res.status(400).json({
                    success: false,
                    message: "Payment order does not match booking request",
                })
            }

            const bookingSeatValidation = await showSeatService.validateBookingSeatSelection(show, normalizedSeats)
            const pricing = calculateBookingPricing({
                show,
                seats: normalizedSeats,
                feePerTicket,
                showSeats: bookingSeatValidation.mode === showSeatService.BOOKING_SEAT_VALIDATION_MODE.INITIALIZED
                    ? bookingSeatValidation.showSeats
                    : null,
            })

            if(
                Number(razorpayOrder.amount) !== pricing.totalAmountInPaise
                || Number(razorpayPayment.amount) !== pricing.totalAmountInPaise
            )
            {
                return res.status(400).json({
                    success: false,
                    message: "Payment amount does not match booking amount",
                })
            }

            const existingBooking = await Booking.findOne({
                $or: [
                    { transactionId },
                    { orderId },
                ],
            }).select("_id")

            if(existingBooking)
            {
                return res.status(409).json({
                    success: false,
                    message: "Payment has already been used for a booking",
                })
            }

            if (bookingSeatValidation.mode === showSeatService.BOOKING_SEAT_VALIDATION_MODE.INITIALIZED) {
                const session = await mongoose.startSession()
                let newBooking
                let reservedShow

                try
                {
                    await session.withTransaction(async () => {
                        const transactionalShow = await loadShowForBooking(showId, { session })
                        await showSeatService.validateBookingSeatSelection(transactionalShow, normalizedSeats, { session })

                        reservedShow = await Show.findOneAndUpdate(
                            { _id: showId, bookedSeats: { $nin: normalizedSeats } },
                            { $push: { bookedSeats: { $each: normalizedSeats } } },
                            { returnDocument: "after", session },
                        ).populate(["movie", "theatre"])

                        if (!reservedShow)
                        {
                            throw new Error("SEAT_RESERVATION_CONFLICT")
                        }

                        newBooking = createBookingDocument({
                            showId,
                            userId: req.userId,
                            seats: normalizedSeats,
                            seatType,
                            transactionId,
                            orderId,
                            receipt,
                            razorpayOrder,
                            pricing,
                            gstPercent,
                            paymentMethod,
                        })

                        await newBooking.save({ session })
                        await showSeatService.markSeatsBookedForBooking({
                            showId,
                            seatNumbers: normalizedSeats,
                            bookingId: newBooking._id,
                            bookedAt: newBooking.createdAt || new Date(),
                        }, { session })
                    })
                }
                catch (err)
                {
                    if(err.code === 11000)
                    {
                        return res.status(409).json({
                            success: false,
                            message: "Payment has already been used for a booking",
                        })
                    }

                    if(err.message === "SEAT_RESERVATION_CONFLICT")
                    {
                        return res.status(409).send({
                            success: false,
                            message: "Some seats were already booked. Please choose different seats.",
                        })
                    }

                    throw err
                }
                finally
                {
                    await session.endSession()
                }

                await sendTicketArtifacts({ newBooking, reservedShow })

                return res.send({
                    success: true,
                    message: "Booking Successful",
                    data: newBooking
                })
            }

            // 1) Atomically reserve seats to prevent double booking
            // If any requested seat already exists in bookedSeats, the update will fail (result = null)
            const reservedShow = await Show.findOneAndUpdate(
                { _id: showId, bookedSeats: { $nin: normalizedSeats } },
                { $push: { bookedSeats: { $each: normalizedSeats } } },
                { returnDocument: "after" },
            ).populate(["movie", "theatre"])

            if (!reservedShow) 
            {
                return res.status(409).send({
                    success: false,
                    message: "Some seats were already booked. Please choose different seats.",
                })
            }

            // const show = await Show.findById(req.body.show).populate("movie");
            // const updatedBookedSeats = [...show.bookedSeats, ...req.body.seats]
            
            // await Show.findByIdAndUpdate(req.body.show, {
            //     bookedSeats: updatedBookedSeats
            // });
        
            // 2) Create Booking
            const bookingId = generateBookingId();
            const newBooking = new Booking({
                show: showId,
                user: req.userId,
                seats: normalizedSeats,
                seatType: seatType || "Standard",
                transactionId,
                orderId,
                receipt: razorpayOrder.receipt || receipt,
                bookingId,
                ticketAmount: pricing.ticketAmount,
                seatPricing: pricing.seatPricing,
                amount: pricing.totalAmount,
                convenienceFee: pricing.convenienceFee,
                gstPercent: gstPercent ?? 18,
                paymentMethod: paymentMethod || "N/A",
                ticketStatus: "Confirmed",
            });

            try 
            {
                await newBooking.save()
            } 
            catch (err) 
            {
                // If booking save fails, rollback the seat reservation
                await Show.findByIdAndUpdate(showId, { $pull: { bookedSeats: { $in: normalizedSeats } } })

                if(err.code === 11000)
                {
                    return res.status(409).json({
                        success: false,
                        message: "Payment has already been used for a booking",
                    })
                }

                throw err
            }
            
            await sendTicketArtifacts({ newBooking, reservedShow })

            res.send({
                success: true,
                message: "Booking Successful",
                data: newBooking
            })
            

    } catch (error) {
        if (error?.details?.unavailableSeats) {
            return sendSeatConflict(res, error)
        }

        if (error?.isOperational) {
            return sendOperationalError(res, error)
        }

        res.status(400);
        next(error);
    }
}


const getBookingsByUserId = async(req, res, next) => {
    try 
    {
        if(req.params.id !== req.userId.toString())
        {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            })
        }

        const populatedBookings = await populateBookingDetails(
            Booking.find({user : req.userId}).sort({ createdAt: -1 })
        );
        
        const simplifiedBookings = populatedBookings.map((booking) => simplifyBooking(booking));
        
        return res.send({
                success: true,
                message: "Booking Info has been fetched",
                data: simplifiedBookings
        });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getAllBookings = async (req, res, next) => {
  try {
    const populatedBookings = await populateBookingDetails(
      Booking.find()
        .sort({ createdAt: -1 })
        .populate("user", "name email phone")
    )

    const simplifiedBookings = populatedBookings.map((booking) => simplifyBooking(booking, { includeUser: true }))

    return res.send({
      success: true,
      message: "All bookings fetched successfully",
      data: simplifiedBookings,
    })
  } catch (error) {
    res.status(400)
    next(error)
  }
}

const getBookingsByTheatre = async (req, res, next) => {
  try {
    const { theatreId } = req.params

    const theatre = await Theatre.findById(theatreId).select("owner")

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      })
    }

    if (req.user?.role === "partner" && theatre.owner?.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Find all shows for this theatre
    const shows = await Show.find({ theatre: theatreId }).select("_id")
    const showIds = shows.map((show) => show._id)

    // Find all bookings for these shows
    const populatedBookings = await populateBookingDetails(
      Booking.find({ show: { $in: showIds } })
        .sort({ createdAt: -1 })
        .populate("user", "name email phone")
    )

    const simplifiedBookings = populatedBookings.map((booking) => simplifyBooking(booking, { includeUser: true }))

    return res.send({
      success: true,
      message: "Theatre bookings fetched successfully",
      data: simplifiedBookings,
    })
  } catch (error) {
    res.status(400)
    next(error)
  }
}

const getRevenueByOwner = async (req, res, next) => {
  try {
    const { ownerId } = req.params

    if (req.user?.role === "partner" && ownerId !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Find all theatres owned by this partner
    const theatres = await Theatre.find({ owner: ownerId }).select("_id name")
    const theatreIds = theatres.map((theatre) => theatre._id)

    // Find all shows for these theatres
    const shows = await Show.find({ theatre: { $in: theatreIds } }).select("_id")
    const showIds = shows.map((show) => show._id)

    // Find all bookings for these shows
    const bookings = await Booking.find({ show: { $in: showIds } }).populate({
      path: "show",
      populate: [
        {
          path: "theatre",
          model: "theatres",
        },
        {
          path: "screen",
          model: "Screen",
          select: "name screenNumber capacity theatre isActive",
        },
      ],
    })

    // Calculate revenue metrics
    const totalRevenue = addCurrency(bookings.map((booking) => booking.amount))
    const totalBookings = bookings.length
    const totalTickets = bookings.reduce((sum, booking) => sum + booking.seats.length, 0)

    // Revenue by theatre
    const revenueByTheatre = {}
    bookings.forEach((booking) => {
      const theatreId = booking.show?.theatre?._id?.toString()
      const theatreName = booking.show?.theatre?.name

      if (!theatreId) {
        return
      }

      if (!revenueByTheatre[theatreId]) {
        revenueByTheatre[theatreId] = {
          theatreId,
          theatreName,
          revenue: 0,
          bookings: 0,
          tickets: 0,
        }
      }

      revenueByTheatre[theatreId].revenue = addCurrency([
        revenueByTheatre[theatreId].revenue,
        booking.amount,
      ])
      revenueByTheatre[theatreId].bookings += 1
      revenueByTheatre[theatreId].tickets += booking.seats.length
    })

    // Revenue by month (last 6 months)
    const revenueByMonth = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      revenueByMonth[monthKey] = 0
    }

    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.createdAt)
      const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, "0")}`
      if (revenueByMonth.hasOwnProperty(monthKey)) {
        revenueByMonth[monthKey] = addCurrency([revenueByMonth[monthKey], booking.amount])
      }
    })

    return res.send({
      success: true,
      message: "Revenue data fetched successfully",
      data: {
        summary: {
          totalRevenue,
          totalBookings,
          totalTickets,
          averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        },
        revenueByTheatre: Object.values(revenueByTheatre),
        revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
          month,
          revenue,
        })),
      },
    })
  } catch (error) {
    res.status(400)
    next(error)
  }
}

module.exports = {
    validateSeats,
    bookSeat,
    createOrder,
    getBookingsByUserId,
    getAllBookings,
    getBookingsByTheatre,
    getRevenueByOwner
}
