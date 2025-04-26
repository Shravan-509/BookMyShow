const Movie = require("../models/movieSchema");

const addMovie = async(req, res, next) => {
    try {
        const {movieName} = req?.body;
        //handle Duplicate Entries
        const movie = await Movie.findOne({ movieName : movieName});
        if(movie)
        {
            return res.send({
                    success: false,
                    message: `${movieName} Movie already exists`
                });
        }
        const newMovie = new Movie(req?.body);
        await newMovie.save();
        return res.send({
                success: true,
                message: `${movieName} Movie has been added`
            });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

const getMovies = async(req, res, next) => {
    try 
    {
        const movies = await Movie.find();
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
        const {movieName} = req?.body;
        const updatedMovie = await Movie.findByIdAndUpdate(
            req?.params?.id, 
            req?.body, 
            { new: true }
        );
        if(!updatedMovie)
        {
            return res.send({
                    success: false,
                    message: `${movieName} Movie not found`,
                });
        }
        return res.send({
            success: true,
            message: `${movieName} Movie has been updated`,
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
        const deletedMovie = await Movie.findByIdAndDelete(req?.params?.id);
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