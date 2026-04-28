import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    loading: false,
    error: null,
    theatre: []
};

const theatreSlice = createSlice({
    name : "theatre",
    initialState,
    reducers: {
        getTheatresRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getTheatresSuccess: (state, action) => {
            state.loading = false
            state.theatre = action.payload
            state.error = null
        },
         getTheatresFailure: (state, action) => {
            state.loading = false
            state.theatre= null
            state.error = action.payload 
        },

        addTheatreRequest: (state) => {
            state.loading = true
            state.error = null
        },
        addTheatreSuccess: (state, action) => {
            state.loading = false
            state.theatre = action.payload
            state.error = null
        },
        addTheatreFailure: (state, action) => {
            state.loading = false
            state.theatre = []
            state.error = action.payload
        },

        updateTheatreRequest: (state) => {
            state.loading = true
            state.error = null
        },
        updateTheatreSuccess: (state, action) => {
            state.loading = false
            state.theatre = action.payload
            state.error = null
        },
        updateTheatreFailure: (state, action) => {
            state.loading = false
            state.theatre = []
            state.error = action.payload
        },

        
        deleteTheatreRequest: (state) => {
            state.loading = true
            state.error = null
        },
        deleteTheatreSuccess: (state, action) => {
            state.loading = false
            state.theatre = action.payload
            state.error = null
        },
        deleteTheatreFailure: (state, action) => {
            state.loading = false
            state.theatre = []
            state.error = action.payload
        },

        // resetTheatreState: (state) => {
        //     state.loading = false;
        //     state.error = null;
        //     state.theatre = [];
        //     state.selectedTheatre = []
        // }
    }
});

//Export actions
export const {
    getTheatresRequest,
    getTheatresSuccess, 
    getTheatresFailure,
    addTheatreRequest, 
    addTheatreSuccess,
    addTheatreFailure,
    updateTheatreRequest,
    updateTheatreSuccess,
    updateTheatreFailure,
    deleteTheatreRequest,
    deleteTheatreSuccess,
    deleteTheatreFailure
} = theatreSlice.actions;

// Base selector
const selectTheatreState = (state) => state.theatre;

// Memoized selectors using reselect
export const selectTheatreLoading = createSelector([selectTheatreState], (theatre) => theatre.loading);
export const selectTheatreError = createSelector([selectTheatreState], (theatre) => theatre.resetLoading);
export const selectTheatre = createSelector([selectTheatreState], (theatre) => theatre.theatre);

// Complex memoized selectors
export const selectTheatreCount = createSelector(
  [selectTheatre],
  (theatres) => theatres ? theatres.length : 0
);

export const selectTheatresByCity = createSelector(
  [selectTheatre],
  (theatres) => {
    if (!theatres) return {};
    return theatres.reduce((acc, theatre) => {
      const city = theatre.city || 'Unknown';
      if (!acc[city]) acc[city] = [];
      acc[city].push(theatre);
      return acc;
    }, {});
  }
);

export const selectSelectedTheatre = createSelector(
  [selectTheatreState],
  (theatre) => theatre.selectedTheatre
);

export default theatreSlice.reducer;
