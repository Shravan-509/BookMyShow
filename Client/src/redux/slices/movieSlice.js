import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from 'reselect';

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

// Base selector
const selectMovieState = (state) => state.movie;

// Memoized selectors using reselect
export const selectMovieLoading = createSelector([selectMovieState], (movie) => movie.loading);
export const selectMovieError = createSelector([selectMovieState], (movie) => movie.error);
export const selectMovie = createSelector([selectMovieState], (movie) => movie.movie);
export const selectSelectedMovie = createSelector([selectMovieState], (movie) => movie.selectedMovie);

// Complex selector - movies with availability
export const selectAvailableMovies = createSelector(
  [selectMovie],
  (movies) => movies && movies.filter(m => m && m.releaseDate)
);

// Memoized movie count
export const selectMovieCount = createSelector(
  [selectMovie],
  (movies) => movies ? movies.length : 0
);

export default movieSlice.reducer;
