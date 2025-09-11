const PDFDocument = require("pdfkit")
const QRCode = require("qrcode")
const axios = require("axios")

async function fetchImageBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" })
  return Buffer.from(res.data, "binary")
}

function drawHeader(doc, movie, theatre) 
{
  doc.fontSize(20).text("BookMyShow - E-Ticket", { align: "center" }).moveDown(0.5)
  doc
    .fontSize(14)
    .text(`Movie: ${movie?.movieName || movie?.title || "N/A"}`, { align: "center" })
    .text(`Theatre: ${theatre?.name || "N/A"}`, { align: "center" })
    .moveDown(1)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(1)
}

async function generateTicketPDF({ booking, show, movie, theatre }) {
  return new Promise(async (resolve, reject) => {
    try 
    {
      const doc = new PDFDocument({ size: "A4", margin: 40 })
      const chunks = []
      doc.on("data", (c) => chunks.push(c))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    
      // HEADER BAR
      doc.rect(0, 0, doc.page.width, 70).fill("#f84464")
      doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
      doc.text("BookMyShow - E-Ticket", { align: "center" })
      doc.moveDown(1)

      // --- MOVIE CARD SECTION ---
      const cardTop = doc.y + 20
      doc.roundedRect(40, cardTop, doc.page.width - 80, 200, 8).stroke("#ddd")
     
      // Movie Poster
      let posterX = 50, posterY = cardTop + 10
      const posterWidth = 100;
      const posterHeight = 140;
      const radius = 5; // corner radius

      if (movie?.poster) {
        try {
          const posterBuffer = await fetchImageBuffer(movie.poster)
          // Save graphics state
          doc.save();

          // Create rounded rectangle path
          doc.roundedRect(posterX, posterY, posterWidth, posterHeight, radius).clip();

          // Draw image inside clipping area
          doc.image(posterBuffer, posterX, posterY, {
            width: posterWidth,
            height: posterHeight,
          });

          // Restore graphics state
          doc.restore();
         
        } catch (e) {
          console.log("Poster fetch failed:", e.message)
        }
      }

       // Movie & Theatre Details
      let detailsX = 170
      doc.fillColor("#000")

      doc.fontSize(16).text(`${movie?.movieName || "N/A"}`, detailsX, posterY, { width: 250, continued: false })
      doc.fontSize(12).text(`${theatre?.name || "N/A"}`, detailsX, doc.y + 10, { width: 250, continued: false })
      doc.fontSize(10).font("Helvetica").fillColor("#666").text(`${theatre?.address || "N/A"}`, detailsX, doc.y + 2, { width: 250, continued: false });
    
      const dateStr = new Date(show?.date || booking?.createdAt).toLocaleDateString("en-US", {
        weekday:"short",
            day:"numeric",
            month:"short",
            year:"numeric"
      })

      let [hours, minutes] = (show?.time || "00:00").split(":");
        let dateObj = new Date();
        dateObj.setHours(hours, minutes);
        let showTime = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });

      doc.fontSize(12)
      // Booking ID
      doc.font("Helvetica-Bold").fillColor("#000").text("Booking ID: ", detailsX, doc.y + 10, { continued: true });
      doc.font("Helvetica").fillColor("#666").text(`${booking.bookingId}`);

      // Show Date
      doc.font("Helvetica-Bold").fillColor("#000").text("Show Date: ", detailsX, doc.y + 10, { continued: true });
      doc.font("Helvetica").fillColor("#666").text(dateStr);

      // Show Time
      doc.font("Helvetica-Bold").fillColor("#000").text("Show Time: ", detailsX, doc.y + 2, { continued: true });
      doc.font("Helvetica").fillColor("#666").text(showTime || "N/A");

      // Seats
      doc.font("Helvetica-Bold").fillColor("#000").text("Seats: ", detailsX, doc.y + 10, { continued: true });
      doc.font("Helvetica").fillColor("#666").text(booking.seats?.join(", ") || "N/A");
    

      //Qr Code
      const qrPayload = booking.bookingId
      const qrDataURL = await QRCode.toDataURL(qrPayload, { margin: 1, scale: 6 })
      // Convert DataURL to buffer
      const base64 = qrDataURL.split(",")[1]
      const qrBuffer = Buffer.from(base64, "base64")
      doc.image(qrBuffer, doc.page.width - 130, posterY, { width: 80, height: 80 })
      doc.moveDown(5)

      //Order Summary
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text("Order Summary", 40, doc.y)
      doc.moveDown(1)

      doc.rect(40, doc.y, doc.page.width - 70, 130).stroke("#ccc")
      let summaryY = doc.y + 10

      // Ticket Amount
      let ticketAmount = (show?.ticketPrice || 0 ) * booking.seats?.length
      let convenienceFee = booking.convenienceFee ?? 0;
      let gstPercent = booking?.gstPercent || 18;
      let gst = gstPercent / 100; 
      let baseAmount = convenienceFee / (1 + gst) ;
      let gstAmount = baseAmount * gst ;

      doc.fontSize(12).fillColor("#000").font("Helvetica")

      doc.text("Ticket Amount", 50, summaryY)
      doc.text(`Rs. ${ticketAmount.toFixed(2)}`, doc.page.width - 120, summaryY, { align: "right" })

      summaryY += 20
      doc.text("Convenience Fee", 50, summaryY)
      doc.text(`Rs. ${convenienceFee.toFixed(2)}`, doc.page.width - 120, summaryY, { align: "right" })

      doc.fontSize(10).fillColor("#000").font("Helvetica")

      summaryY += 20
      doc.text('Base Amount', 50, summaryY)
      doc.text(`Rs. ${(baseAmount || 0).toFixed(2)}`, doc.page.width - 120, summaryY, { align: "right" })

      summaryY += 15
      doc.text(`GST (${gstPercent}%)`, 50, summaryY)
      doc.text(`Rs. ${(gstAmount || 0).toFixed(2)}`, doc.page.width - 120, summaryY, { align: "right" })

      // Amount Paid Highlight
      summaryY += 20
      doc.moveTo(50, summaryY).lineTo(doc.page.width - 50, summaryY).dash(3, { space: 2 }).stroke()
    

      doc.moveTo(50, summaryY)
        .lineTo(doc.page.width - 40, summaryY)
        .dash(10, { space: 5 })  // longer dashes, bigger gaps
        .stroke();

      summaryY += 20
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text("Amount Paid", 50, summaryY)
      doc.text(`Rs. ${booking.amount.toFixed(2)}`, doc.page.width - 150, summaryY, { align: "right" })

      // Footer Note
      doc.fontSize(10).fillColor("#666").text(
        "Note: Please arrive 15 minutes before showtime. Carry a valid ID. Tickets are non-refundable and non-transferable.",
        40, summaryY + 60, { width: 500 }
      )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = {
  generateTicketPDF,
}
