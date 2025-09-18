import { takeLatest, put, call } from "redux-saga/effects"
import { bookingsByUserId, bookSeat, validateSeats } from "../../api/booking";
import { bookSeatsFailure, bookSeatsRequest, bookSeatsSuccess, getUserBookingsFailure, getUserBookingsRequest, getUserBookingsSuccess, validateSeatBookingFailure, validateSeatBookingRequest, validateSeatBookingSuccess } from "../slices/bookingSlice";
import { notify } from "../../utils/notificationUtils";

// API calls
const validateSeatsAPI = async (payload) => {
    try {
        const response = await validateSeats(payload);
        return response;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to validate seats';
        throw new Error(message);
    }
};

const bookSeatsAPI = async (payload) => {
    try {
        const response = await bookSeat(payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to book seats';
        throw new Error(message);
    }
};

const getUserBookingAPI = async (userId) => {
    try {
        const response = await bookingsByUserId(userId);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch user bookings';
        throw new Error(message);
    }
};

// Worker Sagas
function* validateSeatBookingSaga(action) {
    try{
        
        const response = yield call(validateSeatsAPI, action.payload);
        if(response.success)
        {
            yield put(validateSeatBookingSuccess({
                success: response.success,
                data: response.data}
            ))
            notify("success", response.message || "Seats validated successfully");
        }
        else
        {
            yield put(validateSeatBookingFailure(response.message))
            notify("warning", response.message || "Seats validation failed");
        }
        
    }
    catch(error)
    {
        yield put(validateSeatBookingFailure(error.message));
       notify("error", "Error validating seats. Please try again.", error?.message)
    }
}

function* bookSeatsSaga(action) {
    try{
        
        const response = yield call(bookSeatsAPI, action.payload);
        if(response.success)
        {
            yield put(bookSeatsSuccess(response.data))
            notify("success", response.message || "Booking successful")
        }
        else
        {
            yield put(bookSeatsFailure(response.message))
            notify("warning", response.message || "Booking failed");
        }
        
    }
    catch(error)
    {
        yield put(bookSeatsFailure(error.message));
       notify("error", "Error processing booking. Please try again.", error?.message)
    }
}

function* getUserBookingsSaga(action) {
    try{
        
        const response = yield call(getUserBookingAPI, action.payload);
        if(response.success)
        {
            yield put(getUserBookingsSuccess(response.data))
        }
        else
        {
            yield put(getUserBookingsFailure(response.message))
            notify("warning", response.message || "Failed to fetch bookings");
        }
        
    }
    catch(error)
    {
        yield put(getUserBookingsFailure(error.message));
       notify("error", "Error fetching bookings. Please try again.", error?.message)
    }
}

// Watcher Saga
export function* bookingSaga() {
    yield takeLatest(validateSeatBookingRequest.type, validateSeatBookingSaga)
    yield takeLatest(bookSeatsRequest.type, bookSeatsSaga)
    yield takeLatest(getUserBookingsRequest.type, getUserBookingsSaga)
}