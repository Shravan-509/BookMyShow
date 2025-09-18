import { useDispatch, useSelector } from "react-redux"
import { 
    bookSeatsRequest,
    clearBookingData,
    clearValidationResult,
    getUserBookingsRequest,
    selectBookingData, 
    selectBookingError, 
    selectBookingLoading, 
    selectUserBookings, 
    selectValidationResult, 
    validateSeatBookingRequest
} from "../redux/slices/bookingSlice"

export const useBooking = () => {
    const dispatch = useDispatch()

    // Selectors
    const loading = useSelector(selectBookingLoading)
    const error = useSelector(selectBookingError)
    const validationResult = useSelector(selectValidationResult)
    const bookingData = useSelector(selectBookingData)
    const userBookings = useSelector(selectUserBookings)

    // Actions
    const validateSeatBooking = (payload) => {
        dispatch(validateSeatBookingRequest(payload))
    }

    const bookSeats = (payload) => {
        dispatch(bookSeatsRequest(payload))
    }

    const getUserBookings = (userId) => {
        dispatch(getUserBookingsRequest(userId))
    }

    const clearValidation = () => {
        dispatch(clearValidationResult())
    }

    const clearBooking = () => {
        dispatch(clearBookingData())
    }

    return {
        // State
        loading,
        error,
        validationResult,
        bookingData,
        userBookings,

        // Actions
        validateSeatBooking,
        bookSeats,
        getUserBookings,
        clearValidation,
        clearBooking
    }
}