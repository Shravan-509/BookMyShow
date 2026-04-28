import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

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

// Base selector
const selectBookingState = (state) => state.booking;

// Memoized selectors using reselect
export const selectBookingLoading = createSelector([selectBookingState], (booking) => booking.loading);
export const selectBookingError = createSelector([selectBookingState], (booking) => booking.error);
export const selectValidationResult = createSelector([selectBookingState], (booking) => booking.validationResult);
export const selectBookingData = createSelector([selectBookingState], (booking) => booking.bookingData);
export const selectUserBookings = createSelector([selectBookingState], (booking) => booking.userBookings);

export const selectAllBookings = createSelector([selectBookingState], (booking) => booking.allBookings);
export const selectTheatreBookings = createSelector([selectBookingState], (booking) => booking.theatreBookings);
export const selectRevenueData = createSelector([selectBookingState], (booking) => booking.revenueData);

export const selectRazorpayOrder = createSelector([selectBookingState], (booking) => booking.razorpayOrder);
export const selectIsPaymentProcessing = createSelector([selectBookingState], (booking) => booking.isPaymentProcessing);
export const selectPaymentError = createSelector([selectBookingState], (booking) => booking.paymentError);

// Complex memoized selectors
export const selectConfirmedBookings = createSelector(
  [selectUserBookings],
  (bookings) => bookings ? bookings.filter(b => b.status === 'confirmed') : []
);

export const selectTotalRevenue = createSelector(
  [selectRevenueData],
  (revenue) => revenue ? revenue.reduce((sum, r) => sum + (r.amount || 0), 0) : 0
);

export const selectBookingCount = createSelector(
  [selectAllBookings],
  (bookings) => bookings ? bookings.length : 0
);

export default bookingSlice.reducer;