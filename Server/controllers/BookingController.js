const Booking = require("../models/bookingSchema");
const Show = require("../models/showSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { generateBookingId } = require("../utils/idGenerator");

const path = require("path")
const User = require("../models/userSchema")
const { generateTicketPDF } = require("../utils/ticket-pdf")
const { sendTicketEmail } = require("../utils/email")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const validateSeats = async (req, res, next) => {
    try {
        const { showId, seats } = req.body

        if(!showId || !seats || !Array.isArray(seats) || seats.length === 0)
        {
            return res.status(400).send({
                success: false,
                message: "Show Id and Seats Array are required"
            })
        }

        // Find the show and check seat availability
        const show = await Show.findById(showId).populate(["movie", "theatre"])

        if(!show)
        {
            return res.status(404).send({
                success: false,
                message: "Show not found"
            })
        }

        // Check if any of the requested seats are already booked
        const unavailableSeats = seats.filter((seat) => show.bookedSeats.includes(seat))

        if(unavailableSeats.length > 0)
        {
            return res.status(409).send({
                success: false,
                message: `Seats ${unavailableSeats.join(", ")} are no longer available`,
                data: {
                    availableSeats : seats.filter((seat) => !show.bookedSeats.includes(seat)),
                    unavailableSeats: unavailableSeats,
                    allBookedSeats: show.bookedSeats
                }
            })
        }

        // All Seats are available
        res.send({
            success: true,
            message: "All selected seats are available",
            data: {
                availableSeats : seats,
                unavailableSeats: [],
                allBookedSeats: show.bookedSeats,
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
        res.status(400)
        next(error)
    }
}


const createOrder = async (req, res, next) => {
    try {
        const{ amount } = req.body;

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: "BMS_TICKET_" + new Date().getTime()
        }

        const order = await razorpay.orders.create(options);

        res.send({
            success: true,
            message: "Order Creation Successfull",
            data: order
        });

    } catch (error) {
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
            amount,
            seatType,
            convenienceFee,
            gstPercent,
            paymentMethod,
            receipt,
        } = req.body;
        
       
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + transactionId)
            .digest("hex");

            if (generatedSignature !== signature) 
            {
                return res.json({ success: false, message: "Invalid payment" })
            }

            // 1) Atomically reserve seats to prevent double booking
            // If any requested seat already exists in bookedSeats, the update will fail (result = null)
            const reservedShow = await Show.findOneAndUpdate(
                { _id: showId, bookedSeats: { $nin: seats } },
                { $push: { bookedSeats: { $each: seats } } },
                { new: true },
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
                user: req.body.userId,
                seats,
                seatType: seatType || "Standard",
                transactionId,
                orderId,
                receipt,
                bookingId,
                amount: amount / 100,
                convenienceFee: convenienceFee ?? 0,
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
                await Show.findByIdAndUpdate(showId, { $pull: { bookedSeats: { $in: seats } } })
                throw err
            }
            
            // 3) Generate Ticket PDF
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

            // 4) Email Ticket (attach PDF if generated)
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

            res.send({
                success: true,
                message: "Booking Successful",
                data: newBooking
            })
            

    } catch (error) {
        res.status(400);
        next(error);
    }
}


const getBookingsByUserId = async(req, res, next) => {
    try 
    {
        const populatedBookings = await Booking.find({user : req?.params?.id})
            .sort({ createdAt: -1 })
            .populate({
                path: "show",
                populate: {
                    path: "movie",
                    model: "movies",
                },
            })
            .populate({
                path: "show",
                populate: {
                    path: "theatre",
                    model: "theatres",
                },
            });
        
        const simplifiedBookings = populatedBookings.map((booking) => {
            const show = booking.show;
            const movie = show?.movie;
            const theatre = show?.theatre;

            return {
                movieTitle: movie?.movieName,
                theatreName: theatre?.name,
                poster: movie?.poster,
                showDate: show?.date,
                showTime: show?.time,
                seats: booking.seats,
                ticketPrice: show?.ticketPrice,
                convenienceFee: booking?.convenienceFee,
                gstPercent: booking?.gstPercent,
                ticketStatus: booking?.ticketStatus,
                seatType: booking?.seatType,
                bookingId: booking?.bookingId,
                bookingTime: booking?.createdAt,
                paymentMethod: booking?.paymentMethod,
            };
        });
        
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
    const populatedBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "movies",
        },
      })
      .populate({
        path: "show",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      })

    const simplifiedBookings = populatedBookings.map((booking) => {
      const show = booking.show
      const movie = show?.movie
      const theatre = show?.theatre
      const user = booking.user

      return {
        _id: booking._id,
        userName: user?.name,
        userEmail: user?.email,
        userPhone: user?.phone,
        movieTitle: movie?.movieName,
        theatreName: theatre?.name,
        poster: movie?.poster,
        showDate: show?.date,
        showTime: show?.time,
        seats: booking.seats,
        ticketPrice: show?.ticketPrice,
        convenienceFee: booking?.convenienceFee,
        gstPercent: booking?.gstPercent,
        ticketStatus: booking?.ticketStatus,
        seatType: booking?.seatType,
        bookingId: booking?.bookingId,
        bookingTime: booking?.createdAt,
        paymentMethod: booking?.paymentMethod,
        amount: booking?.amount,
      }
    })

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

    const Show = require("../models/showSchema")

    // Find all shows for this theatre
    const shows = await Show.find({ theatre: theatreId }).select("_id")
    const showIds = shows.map((show) => show._id)

    // Find all bookings for these shows
    const populatedBookings = await Booking.find({ show: { $in: showIds } })
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "movies",
        },
      })
      .populate({
        path: "show",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      })

    const simplifiedBookings = populatedBookings.map((booking) => {
      const show = booking.show
      const movie = show?.movie
      const theatre = show?.theatre
      const user = booking.user

      return {
        _id: booking._id,
        userName: user?.name,
        userEmail: user?.email,
        userPhone: user?.phone,
        movieTitle: movie?.movieName,
        theatreName: theatre?.name,
        poster: movie?.poster,
        showDate: show?.date,
        showTime: show?.time,
        seats: booking.seats,
        ticketPrice: show?.ticketPrice,
        convenienceFee: booking?.convenienceFee,
        gstPercent: booking?.gstPercent,
        ticketStatus: booking?.ticketStatus,
        seatType: booking?.seatType,
        bookingId: booking?.bookingId,
        bookingTime: booking?.createdAt,
        paymentMethod: booking?.paymentMethod,
        amount: booking?.amount,
      }
    })

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

    const Theatre = require("../models/theatreSchema")
    const Show = require("../models/showSchema")

    // Find all theatres owned by this partner
    const theatres = await Theatre.find({ owner: ownerId }).select("_id name")
    const theatreIds = theatres.map((theatre) => theatre._id)

    // Find all shows for these theatres
    const shows = await Show.find({ theatre: { $in: theatreIds } }).select("_id")
    const showIds = shows.map((show) => show._id)

    // Find all bookings for these shows
    const bookings = await Booking.find({ show: { $in: showIds } }).populate({
      path: "show",
      populate: {
        path: "theatre",
        model: "theatres",
      },
    })

    // Calculate revenue metrics
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0)
    const totalBookings = bookings.length
    const totalTickets = bookings.reduce((sum, booking) => sum + booking.seats.length, 0)

    // Revenue by theatre
    const revenueByTheatre = {}
    bookings.forEach((booking) => {
      const theatreId = booking.show?.theatre?._id?.toString()
      const theatreName = booking.show?.theatre?.name

      if (!revenueByTheatre[theatreId]) {
        revenueByTheatre[theatreId] = {
          theatreId,
          theatreName,
          revenue: 0,
          bookings: 0,
          tickets: 0,
        }
      }

      revenueByTheatre[theatreId].revenue += booking.amount
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
        revenueByMonth[monthKey] += booking.amount
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