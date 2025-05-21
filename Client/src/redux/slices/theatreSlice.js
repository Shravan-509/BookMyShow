import {createSlice} from "@reduxjs/toolkit";
import { addTheatre, deleteTheatre, getTheatres, updateTheatre} from "../actions/theatreActions";

const theatreSlice = createSlice({
    name : "theatre",
    initialState: {
        theatre : null,
        loading: true,
        error: null
    },
    reducers: {
    },
    extraReducers: (builder) => {
        builder
        .addCase(addTheatre.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addTheatre.fulfilled, (state, action) => {
            state.loading = false;
            state.theatre = action.payload;
        })
        .addCase(addTheatre.rejected, (state, action) => {
            state.theatre = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(updateTheatre.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateTheatre.fulfilled, (state, action) => {
            state.loading = false;
            state.theatre = action.payload;
        })
        .addCase(updateTheatre.rejected, (state, action) => {
            state.theatre = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(deleteTheatre.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteTheatre.fulfilled, (state, action) => {
            state.loading = false;
            state.theatre = action.payload;
        })
        .addCase(deleteTheatre.rejected, (state, action) => {
            state.theatre = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(getTheatres.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getTheatres.fulfilled, (state, action) => {
            state.loading = false;
            state.theatre = action.payload;
        })
        .addCase(getTheatres.rejected, (state, action) => {
            state.theatre = null,
            state.loading = false;
            state.error = action.payload;
        })
    }
});

// export const {logout} = authSlice.actions;
export default theatreSlice.reducer;