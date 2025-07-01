const Show = require("../models/showSchema");
const Movie = require("../models/movieSchema");
const Theatre = require("../models/theatreSchema");

const addShow = async(req, res, next) => {
    try {
        const {name} = req?.body;
        const newShow = new Show(req?.body);
        await newShow.save();
        return res.send({
                success: true,
                message: `${name} has been added`
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};


const updateShow = async(req, res, next) => {
    try 
    {
        const {name} = req?.body;
        const updatedShow = await Show.findByIdAndUpdate(
            req?.params?.id, 
            req?.body, 
            { new: true }
        );
        if(!updatedShow)
        {
            return res.send({
                    success: false,
                    message: `${name} not found`,
                });
        }
        return res.send({
            success: true,
            message: `${name} has been updated`,
            data: updatedShow
        });
        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const deleteShow = async(req, res, next) => {
    try
    {
        const deletedShow = await Show.findByIdAndDelete(req?.params?.id);
        if(!deletedShow)
        {
            return res.send({
                    success: false,
                    message: "Show not found",
                });
        }
        return res.send({
            success: true,
            message: "Show deleted successfully"
        })

        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getShowById = async(req, res, next) => {
    try 
    {
        const shows = await Show.findById(req.params.id)
            .populate("movie")
            .populate("theatre");
        
        if(!shows)
        {
            return res.send({
                success: false,
                message: "Show not found!"
            });
        }
    
        return res.send({
                success: true,
                message: "Show Details Fetched",
                data: shows
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// When Partners gets Theatre shows
const getAllShowsByTheatre = async(req, res, next) => {
    try
    {
        const theatreId = req.params.id;
        const shows = await Show.find({theatre: theatreId}).populate("movie");
        if(!shows)
        {
            return res.send({
                success: false,
                message: `Shows not found`,
            });

        }
        return res.send({
            success: true,
            message: "All shows has been fetched",
            data: shows
        });
        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// when User selects a movie
const getTheatresWithShowsByMovie = async(req, res, next) => {
    try
    {
        const {movie, date} = req.body;
        const shows = await Show.find({movie, date}).populate("theatre");
        
        if(!shows)
        {
            return res.send({
                success: false,
                message: `Shows not found`,
            });

        }
        let uniqueTheatres = [];
        shows.forEach((show) => {
            let isTheatre = uniqueTheatres.find((theatre) => theatre._id === show.theatre._id);

            if(!isTheatre)
            {
                let showsOfThisTheatre = shows.filter(
                            (showObj) => showObj.theatre._id === show.theatre._id
                );
                uniqueTheatres.push({
                    ...show.theatre._doc,
                    shows: showsOfThisTheatre
                })
            }
        })
        
        return res.send({
            success: true,
            message: "All shows has been fetched",
            data: uniqueTheatres
        });
        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

module.exports = {
    addShow,
    getShowById,
    updateShow,
    deleteShow,
    getAllShowsByTheatre,
    getTheatresWithShowsByMovie
}