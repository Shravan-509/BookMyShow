const User = require('../models/userSchema');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



const userInfo = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.userId).select("-password");
        if (!user) {
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

const deleteUser = async(req, res, next) => {
    try {
        const {userId} = req?.body;
        const user = await User.findByIdAndDelete(userId);
        if(!user)
        {
            return res.status(404).send({
                success: false,
                message: "User doesn't exist"
            })
        }

        return res.status(200).send({
            success: true,
            message: "You've Successfully Deleted your Account"
        })
        
    } catch (error) {
        res.status(400);
        next(error);
    }

}

module.exports = {userInfo, deleteUser}