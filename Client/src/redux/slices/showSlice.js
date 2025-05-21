import {createSlice} from "@reduxjs/toolkit";
import { 
    getAllTheatresByMovies, 
    getShowsById, 
    getShowsByTheatre, 
    addShow, 
    updateShow,
    deleteShow
    } from "../actions/showActions";

const showSlice = createSlice({
    name : "show",
    initialState: {
        show : null,
        loading: true,
        error: null
    },
    reducers: {
    },
    extraReducers: (builder) => {
        builder
        .addCase(getShowsById.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getShowsById.fulfilled, (state, action) => {
            state.loading = false;
            state.show = action.payload;
        })
        .addCase(getShowsById.rejected, (state, action) => {
            state.show = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(getShowsByTheatre.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getShowsByTheatre.fulfilled, (state, action) => {
            state.loading = false;
            state.show = action.payload;
        })
        .addCase(getShowsByTheatre.rejected, (state, action) => {
            state.show = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(addShow.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addShow.fulfilled, (state, action) => {
            state.loading = false;
            state.show = action.payload;
        })
        .addCase(addShow.rejected, (state, action) => {
            state.show = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(updateShow.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateShow.fulfilled, (state, action) => {
            state.loading = false;
            state.show = action.payload;
        })
        .addCase(updateShow.rejected, (state, action) => {
            state.show = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(deleteShow.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteShow.fulfilled, (state, action) => {
            state.loading = false;
            state.show = action.payload;
        })
        .addCase(deleteShow.rejected, (state, action) => {
            state.show = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(getAllTheatresByMovies.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getAllTheatresByMovies.fulfilled, (state, action) => {
            state.loading = false;
            state.show = action.payload;
        })
        .addCase(getAllTheatresByMovies.rejected, (state, action) => {
            state.show = null,
            state.loading = false;
            state.error = action.payload;
        })
    }
});

// export const {logout} = authSlice.actions;
export default showSlice.reducer;