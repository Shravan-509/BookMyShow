const movieModel = require("../models/movieSchema");

const addMovie = async(req, res, next) => {
    try {
        //handle Duplicate Entries
        const movie = await movieModel.findOne({ movieName : req?.body.movieName});
        if(movie)
        {
            return res.send({
                    success: false,
                    message: "Movie already exists"
                });
        }
        const newMovie = new movieModel(req?.body);
        await newMovie.save();
        return res.send({
                success: true,
                message: "Movie has been added"
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getMovies = async(req, res, next) => {
    try 
    {
        const movies = await movieModel.find();
        return res.send({
                success: true,
                message: "All movies has been fetched",
                data: movies
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};
const updateMovie = async(req, res, next) => {
    try 
    {
        const updatedMovie = await movieModel.findByIdAndUpdate(
            req?.params?.id, 
            req?.body, 
            { new: true }
        );
        if(!updatedMovie)
        {
            return res.send({
                    success: false,
                    message: "Movie not found",
                });
        }
        return res.send({
            success: true,
            message: "The Movie has been updated",
            data: updatedMovie
        });
        
    } catch (error) {
        res.status(400);
        next(error);
    }
};
const deleteMovie = async(req, res, next) => {
    try
    {
        const deletedMovie = await movieModel.findByIdAndDelete(req?.params?.id);
        if(!deletedMovie)
        {
            return res.send({
                    success: false,
                    message: "Movie not found",
                });
        }
        return res.send({
            success: true,
            message: "The Movie has been deleted"
        })

        
    } catch (error) {
        res.status(400);
        next(error);
    }
};

module.exports = {
    addMovie,
    getMovies,
    updateMovie,
    deleteMovie
}