import { useCallback } from "react"
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
    const validateSeatBooking =  useCallback((payload) => {
        dispatch(validateSeatBookingRequest(payload))
    }, [dispatch])

    const bookSeats =  useCallback((payload) => {
        dispatch(bookSeatsRequest(payload))
    }, [dispatch])

    const getUserBookings =  useCallback((userId) => {
        dispatch(getUserBookingsRequest(userId))
    }, [dispatch])

    const clearValidation =  useCallback(() => {
        dispatch(clearValidationResult())
    }, [dispatch])

    const clearBooking =  useCallback(() => {
        dispatch(clearBookingData())
    }, [dispatch])

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