import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    loading: false,
    error: null,
    movie: [],
    selectedMovie: null,   
};

const movieSlice = createSlice({
    name : "movie",
    initialState,
    reducers: {
        getMoviesRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getMoviesSuccess: (state, action) => {
            state.loading = false
            state.movie = action.payload
            state.error = null
        },
         getMoviesFailure: (state, action) => {
            state.loading = false
            state.movie= null
            state.error = action.payload 
        },

        addMovieRequest: (state) => {
            state.loading = true
            state.error = null
        },
        addMovieSuccess: (state, action) => {
            state.loading = false
            state.movie = action.payload
            state.error = null
        },
        addMovieFailure: (state, action) => {
            state.loading = false
            state.movie = []
            state.error = action.payload
        },

        updateMovieRequest: (state) => {
            state.loading = true
            state.error = null
        },
        updateMovieSuccess: (state, action) => {
            state.loading = false
            state.movie = action.payload
            state.error = null
        },
        updateMovieFailure: (state, action) => {
            state.loading = false
            state.movie = []
            state.error = action.payload
        },

        
        deleteMovieRequest: (state) => {
            state.loading = true
            state.error = null
        },
        deleteMovieSuccess: (state, action) => {
            state.loading = false
            state.movie = action.payload
            state.error = null
        },
        deleteMovieFailure: (state, action) => {
            state.loading = false
            state.movie = []
            state.error = action.payload
        },

        getMovieByIdRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getMovieByIdSuccess: (state, action) => {
            state.loading = false
            state.selectedMovie = action.payload
            state.error = null
        },
        getMovieByIdFailure: (state, action) => {
            state.loading = false
            state.selectedMovie = null
            state.error = action.payload
        },

        resetMovieState: (state) => {
            state.loading = false;
            state.error = null;
            state.movie = [];
            state.selectedMovie = []
        }
    }
});


//Export actions
export const {
    getMoviesRequest,
    getMoviesSuccess, 
    getMoviesFailure,
    addMovieRequest, 
    addMovieSuccess,
    addMovieFailure,
    updateMovieRequest,
    updateMovieSuccess,
    updateMovieFailure,
    deleteMovieRequest,
    deleteMovieSuccess,
    deleteMovieFailure,
    getMovieByIdRequest,
    getMovieByIdSuccess,
    getMovieByIdFailure,
    resetMovieState
} = movieSlice.actions;

// Export selectors
export const selectMovieLoading = (state) => state.movie.loading
export const selectMovieError = (state) => state.movie.resetLoading
export const selectMovie = (state) => state.movie.movie
export const selectSelectedMovie = (state) => state.movie.selectedMovie

export default movieSlice.reducer;