import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    loading: false,
    error: null,
    show: [],
    selectedShow: null,
    success: false
};

const showSlice = createSlice({
    name : "show",
    initialState,
    reducers: {
        addShowRequest: (state) => {
            state.loading = true
            state.error = null
        },
        addShowSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.success = true
            state.error = null
        },
        addShowFailure: (state, action) => {
            state.loading = false
            state.show = []
            state.error = action.payload
        },

        updateShowRequest: (state) => {
            state.loading = true
            state.error = null
        },
        updateShowSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.success = true;
            state.error = null
        },
        updateShowFailure: (state, action) => {
            state.loading = false
            state.show = []
            state.error = action.payload
        },

        deleteShowRequest: (state) => {
            state.loading = true
            state.error = null
        },
        deleteShowSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.success = true;
            state.error = null
        },
        deleteShowFailure: (state, action) => {
            state.loading = false
            state.show = []
            state.error = action.payload
        },

        getShowByIdRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getShowByIdSuccess: (state, action) => {
            state.loading = false
            state.selectedShow = action.payload
            state.error = null
        },
        getShowByIdFailure: (state, action) => {
            state.loading = false
            state.selectedShow = null
            state.error = action.payload
        },

        getShowsByTheatreRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getShowsByTheatreSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.error = null
        },
         getShowsByTheatreFailure: (state, action) => {
            state.loading = false
            state.show= null
            state.error = action.payload 
        },

        getTheatresWithShowsByMovieRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getTheatresWithShowsByMovieSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.error = null
        },
        getTheatresWithShowsByMovieFailure: (state, action) => {
            state.loading = false
            state.show= null
            state.error = action.payload 
        }
    }
});

//Export actions
export const {
    addShowRequest, 
    addShowSuccess,
    addShowFailure,
    updateShowRequest,
    updateShowSuccess,
    updateShowFailure,
    deleteShowRequest,
    deleteShowSuccess,
    deleteShowFailure,
    getShowByIdRequest,
    getShowByIdSuccess,
    getShowByIdFailure,
    getShowsByTheatreRequest,
    getShowsByTheatreSuccess,
    getShowsByTheatreFailure,
    getTheatresWithShowsByMovieRequest,
    getTheatresWithShowsByMovieSuccess,
    getTheatresWithShowsByMovieFailure
} = showSlice.actions;

// Base selector
const selectShowState = (state) => state.show;

// Memoized selectors using reselect
export const selectShowLoading = createSelector([selectShowState], (show) => show.loading);
export const selectShowError = createSelector([selectShowState], (show) => show.resetLoading);
export const selectShow = createSelector([selectShowState], (show) => show.show);
export const selectSelectedShow = createSelector([selectShowState], (show) => show.selectedShow);

// Complex memoized selectors
export const selectShowCount = createSelector(
  [selectShow],
  (shows) => shows ? shows.length : 0
);

export const selectUpcomingShows = createSelector(
  [selectShow],
  (shows) => shows ? shows.filter(s => new Date(s.date) > new Date()) : []
);

// export const {logout} = authSlice.actions;
export default showSlice.reducer;