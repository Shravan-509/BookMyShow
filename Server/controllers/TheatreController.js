const Theatre = require("../models/theatreSchema");

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
            data: updateTheatre
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

const getTheatres = async(req, res, next) => {
    try {
        const theatres = await Theatre.find().populate({
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

const getTheatresByOwner = async(req, res, next) => {
    try {
        const theatres = await Theatre.find({owner: req?.body.userId});
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
    deleteTheatre,
    getTheatresByOwner
};