import { takeLatest, put, call } from "redux-saga/effects"
import { BookingAPI } from "../../api/booking";
import { 
    bookSeatsFailure, bookSeatsRequest, bookSeatsSuccess, 
    getAllBookingsFailure, getAllBookingsRequest, getAllBookingsSuccess, 
    getRevenueDataFailure, getRevenueDataRequest, getRevenueDataSuccess, 
    getTheatreBookingsFailure, getTheatreBookingsRequest, getTheatreBookingsSuccess, 
    getUserBookingsFailure, getUserBookingsRequest, getUserBookingsSuccess, 
    validateSeatBookingFailure, validateSeatBookingRequest, validateSeatBookingSuccess,
    createRazorpayOrderFailure, createRazorpayOrderRequest, createRazorpayOrderSuccess 
} from "../slices/bookingSlice";
import { notify } from "../../utils/notificationUtils";

// API calls
/* const validateSeatsAPI = async (payload) => {
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
        return response;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch user bookings';
        throw new Error(message);
    }
}; */

// Worker Sagas
function* validateSeatBookingSaga(action) {
    try{
        
        const response = yield call(BookingAPI.validateSeats, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(validateSeatBookingFailure(errorMessage));
       notify("error", "Error validating seats. Please try again.", errorMessage)
    }
}

function* bookSeatsSaga(action) {
    try{
        
        const response = yield call(BookingAPI.bookSeats, action.payload);
        if(response.success)
        {
            yield put(bookSeatsSuccess(response.data))
            notify("success", response.message || "Booking successful")
            //Clear pending booking data after successful booking
            sessionStorage.removeItem("pendingBookingData");
        }
        else
        {
            yield put(bookSeatsFailure(response.message))
            notify("warning", response.message || "Booking failed");
        }
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(bookSeatsFailure(errorMessage));
       notify("error", "Error processing booking. Please try again.", error?.message)
    }
}

function* getUserBookingsSaga(action) {
    try{
        const response = yield call(BookingAPI.fetchByUserId, action.payload);
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
        const errorMessage = error.response?.data?.message || error.message
        yield put(getUserBookingsFailure(errorMessage));
        notify("error", "Error fetching bookings. Please try again.", errorMessage)
    }
}

// Admin and Partner worker sagas
function* getAllBookingsSaga() {
  try {
    const response = yield call(BookingAPI.fetchAllBookings)
    if (response.success) 
    {
      yield put(getAllBookingsSuccess(response.data))
    } 
    else 
    {
      yield put(getAllBookingsFailure(response.message))
      notify("warning", response.message || "Failed to fetch bookings");
    }
  } 
  catch (error) 
  {
    const errorMessage = error.response?.data?.message || error.message
    yield put(getAllBookingsFailure(errorMessage));
    notify("error", "Error fetching bookings. Please try again.", errorMessage)
  }
}

function* getTheatreBookingsSaga(action) {
  try {
    const response = yield call(BookingAPI.fetchByTheatre, action.payload)
    if (response.success) 
    {
      yield put(getTheatreBookingsSuccess(response.data))
    } 
    else 
    {
      yield put(getTheatreBookingsFailure(response.message))
      notify("warning", response.message || "Failed to fetch theatre bookings");
    }
  } 
  catch (error) 
  {
    const errorMessage = error.response?.data?.message || error.message
    yield put(getTheatreBookingsFailure(errorMessage));
    notify("error", "Error fetching theatre bookings. Please try again.", errorMessage)
  }
}

function* getRevenueDataSaga(action) {
  try {
    const response = yield call(BookingAPI.fetchRevenueByOwner, action.payload)
    if (response.success) 
    {
      yield put(getRevenueDataSuccess(response.data))
    } 
    else 
    {
      yield put(getRevenueDataFailure(response.message))
      notify("warning", response.message || "Failed to fetch revenue data");
    }
  } 
  catch (error) 
  {
    const errorMessage = error.response?.data?.message || error.message
    yield put(getRevenueDataFailure(errorMessage));
    notify("error", "Error fetching revenue data. Please try again.", errorMessage)
  }
}

function* createRazorpayOrderSaga(action){
  try {
    const response = yield call(BookingAPI.createRazorPayOrder, action.payload)
    if (response.success) 
    {
      yield put(createRazorpayOrderSuccess(response.data))
      // Store payment data for use after Razorpay payment callback
      sessionStorage.setItem("pendingBookingData", JSON.stringify(action.payload))
    } 
    else 
    {
      yield put(createRazorpayOrderFailure(response.message))
      notify("warning", response.message || "Failed to create payment order");
    }
  } 
  catch (error) 
  {
    const errorMessage = error.response?.data?.message || error.message
    yield put(createRazorpayOrderFailure(errorMessage));
    notify("error", "Error creating payment order. Please try again.", errorMessage)
  }
}

// Watcher Saga
export function* bookingSaga() {
    yield takeLatest(validateSeatBookingRequest.type, validateSeatBookingSaga)
    yield takeLatest(bookSeatsRequest.type, bookSeatsSaga)
    yield takeLatest(getUserBookingsRequest.type, getUserBookingsSaga)
    yield takeLatest(getAllBookingsRequest.type, getAllBookingsSaga)
    yield takeLatest(getTheatreBookingsRequest.type, getTheatreBookingsSaga)
    yield takeLatest(getRevenueDataRequest.type, getRevenueDataSaga)
    yield takeLatest(createRazorpayOrderRequest.type, createRazorpayOrderSaga)
}