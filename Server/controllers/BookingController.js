const Booking = require("../models/bookingSchema");
const Show = require("../models/showSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { generateBookingId } = require("../utils/idGenerator");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})


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
        const { transactionId, orderId, signature } = req.body;
        
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + transactionId)
            .digest("hex");
        
            if(generatedSignature === signature)
            {
                const bookingId = generateBookingId();
                const newBooking = new Booking({
                    ...req.body,
                    bookingId
                });
                await newBooking.save();
                
                const show = await Show.findById(req.body.show).populate("movie");
                const updatedBookedSeats = [...show.bookedSeats, ...req.body.seats]
                
                await Show.findByIdAndUpdate(req.body.show, {
                    bookedSeats: updatedBookedSeats
                });

                res.send({
                    success: true,
                    message: "Booking Successful",
                    data: newBooking
                })
            }
            else 
            {
                return res.json({ success: false, message: "Invalid payment" });
            }

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


module.exports = {
    bookSeat,
    createOrder,
    getBookingsByUserId
}