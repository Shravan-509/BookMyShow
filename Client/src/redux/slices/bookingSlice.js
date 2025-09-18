import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    loading: false,
    error: null,
    validationResult: null,
    bookingData: null,
    userBookings: [],   
};

const bookingSlice = createSlice({
    name : "booking",
    initialState,
    reducers: {
        // Validate Seat Booking actions
        validateSeatBookingRequest: (state, action) => {
            state.loading = true
            state.error = null
            state.validationResult = null
        },
        validateSeatBookingSuccess: (state, action) => {
            state.loading = false
            state.validationResult = action.payload
            state.error = null
        },
         validateSeatBookingFailure: (state, action) => {
            state.loading = false
            state.validationResult = null
            state.error = action.payload 
        },

         // Book Seat actions
        bookSeatsRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        bookSeatsSuccess: (state, action) => {
            state.loading = false
            state.bookingData = action.payload
            state.error = null
        },
        bookSeatsFailure: (state, action) => {
            state.loading = false
            state.bookingData = null
            state.error = action.payload
        },

        // Get User Bookings actions
        getUserBookingsRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        getUserBookingsSuccess: (state, action) => {
            state.loading = false
            state.userBookings = action.payload
            state.error = null
        },
        getUserBookingsFailure: (state, action) => {
            state.loading = false
            state.userBookings = []
            state.error = action.payload
        },

        // Clear validation result
        clearValidationResult: (state) => {
            state.validationResult = null
            state.error = null
        },

        // Clear booking Data
         clearBookingData: (state) => {
            state.bookingData = null
            state.error = null
        }
    }
});


//Export actions
export const {
    validateSeatBookingRequest,
    validateSeatBookingSuccess, 
    validateSeatBookingFailure,
    bookSeatsRequest, 
    bookSeatsSuccess,
    bookSeatsFailure,
    getUserBookingsRequest,
    getUserBookingsSuccess,
    getUserBookingsFailure,
    clearValidationResult,
    clearBookingData
} = bookingSlice.actions;

// Export selectors
export const selectBookingLoading = (state) => state.booking.loading
export const selectBookingError = (state) => state.booking.error
export const selectValidationResult = (state) => state.booking.validationResult
export const selectBookingData = (state) => state.booking.bookingData
export const selectUserBookings = (state) => state.booking.userBookings

export default bookingSlice.reducer;