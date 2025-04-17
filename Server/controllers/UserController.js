const userModel = require('../models/userSchema');

const registerUser = async (req, res, next) => {
    try {
        const userExists = await userModel.findOne({email: req?.body?.email});

        if(userExists)
        {
            return res.status(409).json({
                success: false,
                message: "Email already in use. Please login or use a different email"
            })
        }

        const newUser = new userModel(req?.body);
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
        const user = await userModel.findOne({email : userEmail});
        if(!user)
        {
            return res.status(404).send({
                success: false,
                message: "User doesn't exist. Please register"
            })
        }

        if(userPassword !== user.password)
        {
            return res.status(401).send({
                success: false,
                message: "Password Incorrect. Please provide valid Password"
            })
        }

        return res.status(200).send({
            success: true,
            message: "You've Successfully Logged In"
        })

    } catch (error) {
        next(error);
    }
}

const userInfo = async (req, res, next) => {
    try {
        
    } catch (error) {
        next(error);
        
    }
}

const deleteUser = async(req, res, next) => {
    try {
        const userEmail = req?.body.email;
        const user = await userModel.findOneAndDelete({email : userEmail});
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