const User = require('../models/userSchema');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res, next) => {
    try {
        const userExists = await User.findOne({email: req?.body?.email});

        if(userExists)
        {
            return res.status(409).json({
                success: false,
                message: "Email already in use. Please login or use a different email"
            })
        }

        //Hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req?.body?.password, salt);
        req.body.password = hashedPassword;

        const newUser = new User(req?.body);
        await newUser.save();
        return res.status(201).json({
            success: true,
            message: "Registration Successful, Please Login"
        })

    } catch (error) {
        next(error);
    }
};


const loginUser = async (req, res, next) => {
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
            return res.status(401).send({
                success: false,
                message: "Password Incorrect. Please provide valid Password"
            })
        }

        // assign jwt 
        const expiresIn = '1d';
        const access_token = jwt.sign(
            {
                userId: user._id, 
                email: user.email
            }, 
            process.env.SECRET_KEY, 
            { expiresIn }
        );

        const decoded = jwt.decode(access_token); // This just decodes, does NOT verify the token
        const expiresAt = decoded.exp;

        return res.status(200).send({
            success: true,
            message: "You've Successfully Logged In",
            access_token : access_token,
            expiresIn,
            expiresAt: expiresAt 
        })

    } catch (error) {
        next(error);
    }
}

const userInfo = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.userId).select("-password");
        res.send({
            success: true,
            message: "User Details Fetched Successfully",
            data: user
        })
        
    } catch (error) {
        next(error);
    }
}

const deleteUser = async(req, res, next) => {
    try {
        const userEmail = req?.body.email;
        const user = await User.findOneAndDelete({email : userEmail});
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
        next(error);
    }

}


module.exports = {loginUser, registerUser, userInfo, deleteUser}