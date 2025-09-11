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
                        to: toEmail,
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


module.exports = {
    bookSeat,
    createOrder,
    getBookingsByUserId
}