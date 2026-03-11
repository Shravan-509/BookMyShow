const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createVerification, sendVerificationEmail, sendSecurityNotificationEmail } = require('../utils/email');
const User = require('../models/userSchema');
const Verification = require('../models/verificationSchema');
const Booking = require('../models/bookingSchema');
const Theatre = require('../models/theatreSchema');

const userInfo = async (req, res, next) => {
    try {
        const { userId } = req?.body;
        const user = await User.findById(userId).select("-password -__v -resetToken -resetTokenExpiry");
        if (!user) 
        {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            })
        }
        res.send({
            success: true,
            message: "User Details Fetched Successfully",
            user
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }
}


const updateProfile = async (req, res, next) => {
    try {
        const { userId, name, phone } = req?.body;

        // Validation
        if(!name || !phone) 
        {
            return res.status(400).json({ 
                success: false,
                message: "Name and Phone are required" 
            })
        }

        // Validate phone format 
        if (!/^[6-9]\d{9}$/.test(phone)) 
        {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10-digit phone number" 
            })
        }

        const userFields = {name, phone, updateAt: new Date()};

        // Update User
        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: userFields }, 
            { new: true }
        ).select("-password -__v -resetToken -resetTokenExpiry");

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            })
        }

        res.send({
            success: true,
            message: "Profile updated Successfully",
            user
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }
}

const changePassword = async (req, res, next) => {
    try {
        const { userId, currentPassword, newPassword } = req?.body;

        // Validation
        if(!currentPassword || !newPassword) 
        {
            return res.status(400).json({ 
                success: false,
                message: "Current password and new password are required" 
            })
        }

        // Validate Password length 
        if (newPassword.length < 8) 
        {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long" 
            })
        }

        // Find User
        const user = await User.findById(userId)
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            })
        }

        // Check Current Password is valid
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if(!isMatch){
            return res.status(401).json({ 
                success: false,
                message: "Current Password is incorrect" 
            })
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password)
        if(isSamePassword){
            return res.status(400).json({ 
                success: false,
                message: "New password must be different from current password" 
            })
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update Password and increment token version to invalidate all sessions
        await User.findByIdAndUpdate(userId, {
            password : hashedPassword,
            $inc: { tokenVersion: 1 }, // This will invalidate all existing tokens
            updatedAt: new Date()
        });

        // Send Security notification email
        await sendSecurityNotificationEmail(user.email, "password-changed", 
            {
                ipAddress: req.ip || req.connection.remoteAddress
            }
        );

        // Clear the current session cookie
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })

        res.send({
            success: true,
            message: "Password updated Successfully. Please log in again with your new password.",
            requiresReauth: true, 
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }
}

const requestEmailChange = async (req, res, next) => {
    try {
        const { userId, newEmail, password } = req?.body;

        // Validation
        if(!newEmail || !password) 
        {
            return res.status(400).json({ 
                success: false,
                message: "New email and password are required" 
            })
        }

        // Validate email format 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newEmail)) 
        {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address" 
            })
        }

        // Find User
        const user = await User.findById(userId)
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            })
        }

        // Check if new email is same as current
        if(user.email === newEmail)
        {
            return res.status(400).json({ 
                success: false,
                message: "New email must be different from current email" 
            })
        }

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(401).json({ 
                success: false,
                message: "Password is incorrect" 
            })
        }

        // Create verification code for email change
        const code = await createVerification(user._id, "email-change");

        // Store new email in verification document
        await Verification.findOneAndUpdate(
            { userId: user._id, type: "email-change" },
            { $set: { metadata: { newEmail , oldEmail: user.email } } },
            { new: true },
        )

        // Send Verification to new email
        await sendVerificationEmail(newEmail, code, "email-change")

        res.send({
            success: true,
            message: "Verification code sent to new email address"
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }
}

const verifyEmailChange = async (req, res, next) => {
    try {
        const { userId, code, newEmail } = req?.body;

        // Validation
        if(!code || !newEmail) 
        {
            return res.status(400).json({ 
                success: false,
                message: "Verification code and new email are required" 
            })
        }

        // Find Verification record
        const verification = await Verification.findOne({
            userId: userId,
            code,
            type: "email-change",
            expiresAt: { $gt: new Date() }
        })

        if (!verification) 
        {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code" 
            })
        }

        // Verify that the new email matches what was stored
        if (verification.metadata?.newEmail !== newEmail) 
        {
            return res.status(400).json({ 
                success: false,
                message: "Email verification mismatch" 
            })
        }

        // Check if email is still available
        const emailExists = await User.findOne({ email: newEmail })
        if (emailExists && emailExists._id.toString() !== userId) 
        {
            return res.status(400).json({ 
                success: false,
                message: "Email is no longer available" 
            })
        }

        // Get old email for notification
        const oldEmail = verification.metadata?.oldEmail;

        // Find User
        const user = await User.findByIdAndUpdate(
            userId,
            {
                email: newEmail,
                $inc: { tokenVersion: 1 }, // This will invalidate all existing tokens
                updatedAt: new Date()
            },
            { new: true }
        ).select("-password -__v -resetToken -resetTokenExpiry")

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            })
        }

        // Delete Verification record
        await Verification.deleteOne({ _id: verification._id})

        // Send security notification emails to both old and new email addresses
        if (oldEmail) 
        {
            await sendSecurityNotificationEmail(oldEmail, "email-changed", {
                oldEmail,
                newEmail,
                ipAddress: req.ip || req.connection.remoteAddress,
            })
        }

        await sendSecurityNotificationEmail(newEmail, "email-changed", {
            oldEmail,
            newEmail,
            ipAddress: req.ip || req.connection.remoteAddress,
        })

        // Clear the current session cookie
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })

        res.send({
            success: true,
            message: "Email updated Successfully. Please log in again with your new email address.",
            email: newEmail,
            requiresReauth: true,
            user
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }
}

const toggle2FA = async (req, res, next) => {
    try {
        const { userId } = req?.body;
        // Find User
        const user = await User.findByIdAndUpdate(userId)

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            })
        }

        // Toggle 2FA
        const newTwoFactorStatus = !user.twoFactorEnabled
        
        await User.findByIdAndUpdate(userId, {
            twoFactorEnabled: newTwoFactorStatus,
            updatedAt: new Date(),
        })

        res.send({
            success: true,
            message: `Two-factor authentication ${newTwoFactorStatus ? "enabled" : "disabled"}`,
            twoFactorEnabled: newTwoFactorStatus
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }
}

const deleteAccount = async(req, res, next) => {
    try {
        const {userId, password} = req?.body;
        // Validation
        if(!password) 
        {
            return res.status(400).json({ 
                success: false,
                message: "Password is required to delete the account" 
            })
        }
        const user = await User.findById(userId);
        if(!user)
        {
            return res.status(404).send({
                success: false,
                message: "User not found"
            })
        }

         // Check Current Password is valid
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(401).json({ 
                success: false,
                message: "Password is incorrect" 
            })
        }

        // Store user email for notification before deletion
        const userEmail = user.email

        // Send account deletion notification email before deleting
        await sendSecurityNotificationEmail(userEmail, "account-deleted", {
            ipAddress: req.ip || req.connection.remoteAddress,
        })

        // Cascade delete related records
        await Promise.all([
            Verification.deleteMany({ userId: user._id }),
            Booking.deleteMany({ user: user._id }),
            Theatre.deleteMany({ owner: user._id }),
        ]);

        //Delete User Account
        await User.findByIdAndDelete(user._id);

        // Clear the current session cookie
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })

        return res.status(200).send({
            success: true,
            message: "Account deleted successfully"
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }

}

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -__v -resetToken -resetTokenExpiry").sort({ createdAt: -1 })

    res.send({
      success: true,
      message: "All users fetched successfully",
      data: users,
    })
  } catch (error) {
    res.status(400)
    next(error)
  }
}

module.exports = {
    userInfo, 
    updateProfile,
    changePassword,
    requestEmailChange,
    verifyEmailChange,
    toggle2FA,
    deleteAccount,
    getAllUsers
}