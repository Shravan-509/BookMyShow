const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
    {
        movieName:{
            type: String,
            required: true,
            unique: true
        },
        description:{
            type: String,
            required: true,
        },
        duration:{
            type: Number,
            required: true,
        },
        genre:{
            type: Array,
            required: true,
        },
        language:{
            //convert this to array [hindi, english, telugu]
            type: Array,
            required: true,
        },
        releaseDate:{
            type: Date,
            required: true,
        },
        poster:{
            type: String,
            required: true,
        }
    },
    {timestamps: true}
);

const Movie = mongoose.model("movies", movieSchema);
module.exports = Movie;