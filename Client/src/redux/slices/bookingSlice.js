import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    loading: false,
    error: null,
    validationResult: null,
    bookingData: null,
    userBookings: [],  
    allBookings: [],
    theatreBookings: [],
    revenueData: null, 
    razorpayOrder: null,
    isPaymentProcessing: false,
    paymentError: null,
};

const bookingSlice = createSlice({
    name : "booking",
    initialState,
    reducers: {
        // Validate Seat Booking actions
        validateSeatBookingRequest: (state) => {
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
        bookSeatsRequest: (state) => {
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
        getUserBookingsRequest: (state) => {
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
        },

        // Get All Bookings actions
        getAllBookingsRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getAllBookingsSuccess: (state, action) => {
            state.loading = false
            state.allBookings = action.payload
        },
        getAllBookingsFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Get Theatre Bookings actions
        getTheatreBookingsRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getTheatreBookingsSuccess: (state, action) => {
            state.loading = false
            state.theatreBookings = action.payload
        },
        getTheatreBookingsFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Get Bookings Revenue actions
        getRevenueDataRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getRevenueDataSuccess: (state, action) => {
            state.loading = false
            state.revenueData = action.payload
        },
        getRevenueDataFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        createRazorpayOrderRequest: (state) => {
            state.isPaymentProcessing = true
            state.paymentError = null
        },
        createRazorpayOrderSuccess: (state, action) => {
            state.isPaymentProcessing = false
            state.razorpayOrder = action.payload
            state.paymentError = null
        },
        createRazorpayOrderFailure: (state, action) => {
            state.isPaymentProcessing = false
            state.razorpayOrder = null
            state.paymentError = action.payload
        },
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
    getAllBookingsRequest,
    getAllBookingsSuccess,
    getAllBookingsFailure,
    getTheatreBookingsRequest,
    getTheatreBookingsSuccess,
    getTheatreBookingsFailure,
    getRevenueDataRequest,
    getRevenueDataSuccess,
    getRevenueDataFailure,
    createRazorpayOrderRequest,
    createRazorpayOrderSuccess,
    createRazorpayOrderFailure,
    clearValidationResult,
    clearBookingData,
} = bookingSlice.actions;

// Export selectors
export const selectBookingLoading = (state) => state.booking.loading
export const selectBookingError = (state) => state.booking.error
export const selectValidationResult = (state) => state.booking.validationResult
export const selectBookingData = (state) => state.booking.bookingData
export const selectUserBookings = (state) => state.booking.userBookings

export const selectAllBookings = (state) => state.booking.allBookings
export const selectTheatreBookings = (state) => state.booking.theatreBookings
export const selectRevenueData = (state) => state.booking.revenueData

export const selectRazorpayOrder = (state) => state.booking.razorpayOrder
export const selectIsPaymentProcessing = (state) => state.booking.isPaymentProcessing
export const selectPaymentError = (state) => state.booking.paymentError

export default bookingSlice.reducer;