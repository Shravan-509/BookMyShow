import {createSlice} from "@reduxjs/toolkit";

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

// Export selectors
export const selectTheatreLoading = (state) => state.theatre.loading
export const selectTheatreError = (state) => state.theatre.resetLoading
export const selectTheatre = (state) => state.theatre.theatre

export default theatreSlice.reducer;