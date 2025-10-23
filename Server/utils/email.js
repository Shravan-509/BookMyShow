const fs = require("fs");
const path = require("path");
// const nodemailer = require("nodemailer");
const QRCode = require("qrcode")
const sgMail = require("@sendgrid/mail")

const Verification = require('../models/verificationSchema');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//Configure nodemailer
// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: process.env.EMAIL_SECURE === "true",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//     },
// })

// Generate a random 6-digit code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create verification record
const createVerification = async (userId, type) => {
    // Delete any existing verification codes for this user and type
    await Verification.deleteMany({ userId, type });

    //Create new Verification Code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    const verification = new Verification({ 
        userId,
        code,
        type,
        expiresAt
    })

    await verification.save();
    return code;
}


// Read Email template and replace placeHolders
const getEmailTemplate = async(templateName, metaData) => {
    try {
        const templatePath = path.join(__dirname, "email_templates", `${templateName}.html`)
        let template = await fs.promises.readFile(templatePath, "utf-8");

        //Replace all placeholders with actual values
        Object.keys(metaData).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, "g");
            template = template.replace(regex, metaData[key]);
        })
        return template;

    } catch (error) {
        console.error(`Error reading email template: ${error.message}`);
        throw error;
    }
}

// Send verification email
const sendVerificationEmail = async(email, code, type) => {
    try {
        let templateName;
        let subject;
        
        if (type === "email") 
        {
            templateName = "email-verification"
            subject = "Verify your BookMyShow account"
        } 
        else if (type === "2fa") 
        {
            templateName = "two-factor-auth"
            subject = "Your BookMyShow login verification code"
        } 
        else if (type === "reverify") 
        {
            templateName = "reverification"
            subject = "Verify your BookMyShow account"
        }
        if (type === "email-change") 
        {
            templateName = "email-change"
            subject = "Verify your Email change request"
        } 
        
        //Prepare metadta for template
        const metaData = {
            code: code,
            year: new Date().getFullYear().toString()
        }

        // Get Email HTML from template
        const html = await getEmailTemplate(templateName, metaData);

        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject,
            html,
        }

        // const result = await transporter.sendMail({
        //     from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
        //     to: email,
        //     subject,
        //     html,
        // })

        const result = await sgMail.send(msg);

        // console.log(`${templateName} email sent : ${result.messageId}`);
        return result;
        
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw error;        
    }  
}

// Send password reset email
const sendPasswordResetEmail = async({to, name, resetUrl}) => {
    try {
        let templateName = "password-reset";
        let subject = "Password Reset Request";
        
        //Prepare metadta for template
        const metaData = {
            name: name,
            resetUrl: resetUrl,
            year: new Date().getFullYear().toString()
        }

        // Get Email HTML from template
        const html = await getEmailTemplate(templateName, metaData);

        // const result = await transporter.sendMail({
        //     from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
        //     to,
        //     subject,
        //     html,
        // }) 

        const msg = {
            to,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject,
            html,
        }

        const result = await sgMail.send(msg)
        // console.log("Password reset email sent:", result.messageId);
        return result;
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw error;        
    }  
}

// Send security notification email
const sendSecurityNotificationEmail = async (email, type, data = {} ) => {
  try {
    let templateName
    let subject
    const metaData = {
      year: new Date().getFullYear().toString(),
      timestamp: new Date().toLocaleString(),
      ipAddress: data.ipAddress || "Unknown",
    }

    if (type === "password-changed") 
    {
      templateName = "password-changed"
      subject = "Password Changed - BookMyShow Account"
    } 
    else if (type === "email-changed") 
    {
      templateName = "email-changed"
      subject = "Email Address Changed - BookMyShow Account"
      metaData.oldEmail = data.oldEmail
      metaData.newEmail = data.newEmail
    } 
    else if (type === "account-deleted") 
    {
      templateName = "account-deleted"
      subject = "Account Deleted - BookMyShow"
    }

    // Get email HTML from template
    const html = await getEmailTemplate(templateName, metaData)

    // const result = await transporter.sendMail({
    //   from: `"BookMyShow Security" <${process.env.EMAIL_FROM}>`,
    //   to: email,
    //   subject,
    //   html,
    // })

    const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html,
    }

    const result = await sgMail.send(msg)

    // console.log(`✅ Security notification email sent: ${type} to ${email}`)
    return result;
  } catch (error) {
    console.error(`❌ Error sending security notification email: ${error.message}`)
    // Don't throw error for security emails to avoid breaking the main flow
  }
}

// Send security notification email
const sendTicketEmail = async ({name, to, booking, show, movie, theatre, pdfBuffer}) => {
  try {
        let templateName = "movie-ticket";
        let subject = `Your BookMyShow Ticket - ${booking.bookingId}`;

        let showDate = new Date(show?.date || booking?.createdAt).toLocaleDateString("en-US",{weekday:"short",day:"numeric",month:"short",year:"numeric"})
        let [hours, minutes] = (show?.time || "00:00").split(":");
        let dateObj = new Date();
        dateObj.setHours(hours, minutes);
        let showTime = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });

        let quantity = booking.seats?.length || 1 ;
        let quantStr = `${quantity} ticket${quantity > 1 ? "s": ""}`;
        let ticketAmount = show?.ticketPrice * quantity || 0;
        let convenienceFee = booking.convenienceFee ?? 0;
        let gstPercent = booking?.gstPercent || 0;
        let gst = gstPercent / 100; 
        let baseAmount = convenienceFee / (1 + gst) ;
        let gstAmount = baseAmount * gst ;
        let bookingDate = new Date(booking?.createdAt).toLocaleDateString("en-US",{
            weekday:"short",
            day:"numeric",
            month:"short",
            year:"numeric"
        });
        let bookingTime = new Date(booking?.createdAt).toLocaleTimeString("en-US",{
            hour:"2-digit",
            minute:"2-digit"
        });

        const qrPayload = booking?.bookingId;        
        const qrCodeUrl = await QRCode.toDataURL(qrPayload, { margin: 1, scale: 6 })
        
        //Prepare metadta for template
        const metaData = {
            name: name,
            bookingId: booking.bookingId,
            movieName: movie?.movieName || movie?.title || "Movie",
            moviePosterUrl: movie?.poster,
            qrCodeUrl: qrCodeUrl,
            theatreName: theatre?.name || "Theatre Name",
            theatreLocation: theatre?.address || "Location",
            screenName: theatre.screen || "Screen 1",
            showDate : showDate,
            showTime: showTime,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            seats: booking.seats?.join(", ") || "N/A",
            quantity: quantStr,
            ticketAmount: ticketAmount.toFixed(2),
            convenienceFee: convenienceFee.toFixed(2),
            baseAmount: baseAmount.toFixed(2),
            gstPercent: gstPercent,
            gstAmount: gstAmount.toFixed(2),
            amountPaid: (booking.amount ?? 0).toFixed(2),
            paymentMethod: booking?.paymentMethod || "N/A",
            confirmationNumber : (booking?.receipt).slice(-6),
            year: new Date().getFullYear().toString()
        }

        // Get Email HTML from template
        const html = await getEmailTemplate(templateName, metaData);

    //    const mailOptions = {
    //         from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
    //         to,
    //         subject,
    //         html,
    //         attachments: [],
    //     };

        const msg = {
            to,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject,
            html,
            attachments: [],
        }

        if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) 
        {
            msg.attachments.push({
                filename: `ticket-${booking.bookingId}.pdf`,
                content: pdfBuffer.toString("base64"),
                type: "application/pdf",
                disposition: "attachment",
            })
        }

        // const result = await transporter.sendMail(mailOptions);
        const result = await sgMail.send(msg)
        // console.log("Ticket Email with PDF sent:", result.messageId);
        return result;
    } catch (error) {
        console.error(`Error sending ticket email: ${error.message}`);
        throw error;        
    }  
}

module.exports= {
    createVerification,
    generateVerificationCode,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendSecurityNotificationEmail,
    sendTicketEmail
}