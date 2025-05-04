const User = require('../models/userSchema');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {createVerification, sendVerificationEmail} = require("../utils/email");
const Verification = require('../models/verificationSchema');

const register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req?.body

        // Validate input
        if (!name || !email || !phone || !password)
        {
            return res.status(400).json({ 
                success: false,
                message: "Missing required fields"
            })
        }
        
        const existingUser = await User.findOne({ email });

        if(existingUser)
        {
            return res.status(400).json({
                success: false,
                message: "Email already in use. Please use a different Email"
            })
        }

        const phoneNoExists = await User.findOne({ phone });

        if(phoneNoExists)
        {
            return res.status(409).json({
                success: false,
                message: "Mobile Number already in use. Please use a different number"
            })
        }

        //Hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            isVerified: false,
            twoFactorEnabled: true,
        });

        await newUser.save();

        // Create verification code
        const code = await createVerification(newUser._id, "email")

        // Send verification email
        await sendVerificationEmail(email, code, "email");

        return res.status(201).json({
            success: true,
            message: "User registered Successfully, Please Verify your email",
            data : {
                userId: newUser._id
            }
        })

    } catch (error) {
        next(error);
    }
};

const verifyEmail = async(req, res, next) => {
    try {
        const {userId, code} = req?.body;
        
        //Find Verification Record
        const verification = await Verification.findOne({
            userId,
            code,
            type: { $in: ["email", "reverify"] },
            expiresAt: {$gt: new Date()},
        });
        if(!verification)
        {
            return res.status(404).send({
                success: false,
                message: "Invalid or expired verification code"
            })
        }

        //Update User
        await User.findByIdAndUpdate( userId, {isVerified: true});

        //Delete Verification record
        await Verification.deleteOne({ _id: verification._id });

        return res.status(200).send({
            success: true,
            message: "Email Verified Successfully",
        })

    } catch (error) {
        next(error);
    }
}

const resendVerification = async(req, res, next) => {
    try {
        const {userId, email} = req?.body;
        
       // Create verification code
       const code = await createVerification(userId, "email")

       // Send verification email
       await sendVerificationEmail(email, code, "email");

       return res.status(201).json({
           success: true,
           message: "Verification code sent successfully"
       })

    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const userEmail = req?.body.email;
        const userPassword = req?.body?.password;
        const user = await User.findOne({email : userEmail});
        
        if(!user)
        {
            return res.status(404).send({
                success: false,
                message: "User doesn't exist. Please register"
            })
        }

        //Compare with Hashed Password
        const validatePassword = await bcrypt.compare(userPassword, user?.password)
        if(!validatePassword)
        {
            return res.status(400).send({
                success: false,
                message: "Password Incorrect. Please provide valid Password"
            })
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(200).send(
                { 
                    success: true,
                    message: "Your account is not verified. Please verify your email to continue.",
                    data:{
                        code: "UNVERIFIED_ACCOUNT"
                    }
                }
            )
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) 
        {
            // Create 2FA code
            const code = await createVerification(user._id, "2fa")
    
            // Send 2FA email
            await sendVerificationEmail(user.email, code, "2fa")
    
            return res.send({
                success: true,
                message: "Please enter the verification code sent to your email",
                data: {
                    requiresTwoFactor: true,
                    userId: user._id,
                }
            })
        }

        // Create and return JWT Token 
        const expiresIn = '1d';
        const access_token = jwt.sign(
            {
                userId: user._id, 
                // email: user.email
            }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );

        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })

        return res.status(200).send({
            success: true,
            message: "You've Successfully Logged In"
        })

    } catch (error) {
        next(error);
    }
}

const verify2FA = async(req, res, next) => {
    try {
        const {userId, code} = req?.body;
        
        //Find Verification Record
        const verification = await Verification.findOne({
            userId,
            code,
            type : "2fa",
            expiresAt: {$gt: new Date()},
        });

        if(!verification)
        {
            return res.status(404).send({
                success: false,
                message: "Invalid or expired verification code"
            })
        }

        //Delete Verification record
        await Verification.deleteOne({ _id: verification._id });

        // Create and return JWT Token 
        const expiresIn = '1d';
        const access_token = jwt.sign(
            {
                userId: userId, 
                // email: user.email
            }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );

        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })

        return res.status(200).send({
            success: true,
            message: "Two-Factor authentication Successful",
        })

    } catch (error) {
        next(error);
    }
}

const resend2FA = async(req, res, next) => {
    try {
        const {userId, email} = req?.body;
        
       // Create verification code
       const code = await createVerification(userId, "2fa")

       // Send verification email
       await sendVerificationEmail(email, code, "2fa");

       return res.status(201).json({
           success: true,
           message: "Verification code sent successfully"
       })

    } catch (error) {
        next(error);
    }
}

const reverifyEmail = async(req, res, next) => {
    try {
        const {email} = req?.body;

        //Find User by Email

        const user = await User.findOne({ email });

        if(!user)
        {
            return res.status(404).send({
                success: false,
                message: "No account found with this email address"
            })
        }
        
        // Create verification code
        const code = await createVerification(user._id, "reverify")

        // Send verification email
        await sendVerificationEmail(email, code, "reverify");

        return res.status(201).json({
            success: true,
            message: "Verification code sent successfully, Please check your email",
            data : {
                userId: user._id
            }
        })

    } catch (error) {
        next(error);
    }
}

module.exports = {
    register, 
    verifyEmail, 
    resendVerification, 
    reverifyEmail, 
    login, 
    verify2FA, 
    resend2FA
}