import {createSlice} from "@reduxjs/toolkit";
import { getMovies, addMovie, updateMovie, deleteMovie } from "../actions/movieActions";

const movieSlice = createSlice({
    name : "movie",
    initialState: {
        movie : null,
        loading: true,
        error: null
    },
    reducers: {
    },
    extraReducers: (builder) => {
        builder
        .addCase(getMovies.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getMovies.fulfilled, (state, action) => {
            state.loading = false;
            state.movie = action.payload;
        })
        .addCase(getMovies.rejected, (state, action) => {
            state.movie = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(addMovie.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addMovie.fulfilled, (state, action) => {
            state.loading = false;
            state.movie = action.payload;
        })
        .addCase(addMovie.rejected, (state, action) => {
            state.movie = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(updateMovie.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateMovie.fulfilled, (state, action) => {
            state.loading = false;
            state.movie = action.payload;
        })
        .addCase(updateMovie.rejected, (state, action) => {
            state.movie = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(deleteMovie.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteMovie.fulfilled, (state, action) => {
            state.loading = false;
            state.movie = action.payload;
        })
        .addCase(deleteMovie.rejected, (state, action) => {
            state.movie = null,
            state.loading = false;
            state.error = action.payload;
        })
    }
});

// export const {logout} = authSlice.actions;
export default movieSlice.reducer;