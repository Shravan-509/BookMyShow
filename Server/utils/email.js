const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const Verification = require('../models/verificationSchema');

//Configure nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
})

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
        
        //Prepare metadta for template
        const metaData = {
            code: code,
            year: new Date().getFullYear().toString()
        }

        // Get Email HTML from template
        const html = await getEmailTemplate(templateName, metaData);

        await transporter.sendMail({
            from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html,
        }) 
        
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw error;        
    }  
}

module.exports= {
    createVerification,
    generateVerificationCode,
    sendVerificationEmail
}