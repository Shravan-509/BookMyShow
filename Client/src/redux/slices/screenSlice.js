import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    loading: false,
    error: null,
    screensByTheatre: {},
};

const screenSlice = createSlice({
    name: "screen",
    initialState,
    reducers: {
        fetchScreensByTheatreRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchScreensByTheatreSuccess: (state, action) => {
            state.loading = false;
            state.error = null;
            state.screensByTheatre[action.payload.theatreId] = action.payload.screens || [];
        },
        fetchScreensByTheatreFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        createScreenRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        createScreenSuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        createScreenFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateScreenRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        updateScreenSuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        updateScreenFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        deleteScreenRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        deleteScreenSuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        deleteScreenFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchScreensByTheatreRequest,
    fetchScreensByTheatreSuccess,
    fetchScreensByTheatreFailure,
    createScreenRequest,
    createScreenSuccess,
    createScreenFailure,
    updateScreenRequest,
    updateScreenSuccess,
    updateScreenFailure,
    deleteScreenRequest,
    deleteScreenSuccess,
    deleteScreenFailure,
} = screenSlice.actions;

const selectScreenState = (state) => state.screen;

export const selectScreenLoading = createSelector([selectScreenState], (screen) => screen.loading);
export const selectScreenError = createSelector([selectScreenState], (screen) => screen.error);
export const selectScreensByTheatre = (theatreId) => createSelector(
    [selectScreenState],
    (screen) => screen.screensByTheatre[theatreId] || []
);
export const selectActiveScreensByTheatre = (theatreId) => createSelector(
    [selectScreensByTheatre(theatreId)],
    (screens) => screens.filter((screen) => screen.isActive)
);

export default screenSlice.reducer;
