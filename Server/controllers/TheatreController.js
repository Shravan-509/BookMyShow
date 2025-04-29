const Theatre = require("../models/theatreSchema");
const User = require('../models/userSchema');

const addTheatre = async(req, res, next) => {
    try {
        const {name} = req?.body;
        //handle Duplicate Entries
        const theatre = await Theatre.findOne({ name : name});
        if(theatre)
        {
            return res.send({
                    success: false,
                    message: `${name} Theatre already exists`
                });
        }
        const newTheatre = new Theatre(req?.body);
        await newTheatre.save();
        res.send({
            success: true,
            message: `${name} Theatre has been added!`
        })
        
    } catch (error) {
        res.status(400);
        next(error)
    }
};

const updateTheatre = async(req, res, next) => {
    try {
        const id = req?.params.id;
        const {name} = req?.body;
        const updatedTheatre = await Theatre.findByIdAndUpdate(id, req?.body, {new: true})
        
        if(!updatedTheatre){
            return res.send({
                success: false,
                message: `${name} Theatre not found!`,
            });
        }

        res.send({
            success: true,
            message: `${name} Theatre has been updated!`,
            data: updatedTheatre
        })

    } catch (error) {
        res.status(400);
        next(error)
    }
};

const deleteTheatre = async(req, res, next) => {
    try {
        const id = req?.params.id;
        const deletedTheatre = await Theatre.findByIdAndDelete(id)
        if(!deletedTheatre)
        {
            return res.send({
                    success: false,
                    message: "Theatre not found!",
                });
        }
        res.send({
            success: true,
            message: `Theatre has been deleted!`
        })
        
    } catch (error) {
        res.status(400);
        next(error)
    }
};

// getTheatresByOwner & getTheatresForAdmin merged to one dynamic API to get Theatres info
const getTheatres = async(req, res, next) => {
    try {
        console
        // Fetch user info from DB
        const user = await User.findById(req.body.userId);
        if(!user)
        {
            return res.send({
                success: false,
                message: "User not found!",
            })
        }

        let query = {};
        // Check user's role
        if(user.role === "admin"){
            query = {};
        }
        else if(user.role === "partner")
        {
            query = {owner : user._id};
        }
        else
        {
            return res.status(403).json({ message: "Access denied" });
        }

        //Fetch theatres based on query (Admin, Partner)
        const theatres = await Theatre.find(query).populate({
            path: "owner",
            select: "-password"  // exclude password field
          });
          
        return res.send({
                success: true,
                message: "All Theatres has been fetched!",
                data: theatres
            })
        
    } catch (error) {
        res.status(400);
        next(error)
    }
};

module.exports = {
    addTheatre, 
    getTheatres, 
    updateTheatre, 
    deleteTheatre
};