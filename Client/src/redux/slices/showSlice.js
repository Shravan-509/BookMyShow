import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    loading: false,
    error: null,
    show: [],
    selectedShow: null
};

const showSlice = createSlice({
    name : "show",
    initialState,
    reducers: {
        addShowRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        addShowSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.error = null
        },
        addShowFailure: (state, action) => {
            state.loading = false
            state.show = []
            state.error = action.payload
        },

        updateShowRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        updateShowSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.error = null
        },
        updateShowFailure: (state, action) => {
            state.loading = false
            state.show = []
            state.error = action.payload
        },

        deleteShowRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        deleteShowSuccess: (state, action) => {
            state.loading = false
            state.show = action.payload
            state.error = null
        },
        deleteShowFailure: (state, action) => {
            state.loading = false
            state.show = []
            state.error = action.payload
        },

        getShowByIdRequest: (state, action) => {
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

        getShowsByTheatreRequest: (state, action) => {
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

        getTheatresWithShowsByMovieRequest: (state, action) => {
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

// Export selectors
export const selectShowLoading = (state) => state.show.loading
export const selectShowError = (state) => state.show.resetLoading
export const selectShow = (state) => state.show.show
export const selectSelectedShow = (state) => state.show.selectedShow

// export const {logout} = authSlice.actions;
export default showSlice.reducer;