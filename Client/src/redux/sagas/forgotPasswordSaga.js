import { takeLatest, put, call } from "redux-saga/effects";
import { axiosInstance } from "../../api/index";
import { 
    forgotPasswordRequest, 
    forgotPasswordSuccess, 
    forgotPasswordFailure, 
    resetPasswordRequest,
    resetPasswordSuccess,
    resetPasswordFailure
} from "../slices/forgotPasswordSlice";
import { notify } from "../../utils/notificationUtils";
import { ForgotPasswordAPI } from "../../api/forgotPassword";

// Forgot Password API calls
const forgotPasswordAPI = async (email) => {
    try {
        const response = await axiosInstance.post("/auth/forgot-password", {email});
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to send reset email';
        throw new Error(message);
    }
};

const resetPasswordAPI = async (resetData) => {
    try {
        const response = await axiosInstance.post("/auth/reset-password", resetData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to reset password';
        throw new Error(message);
    }
};

// Worker Sagas
function* handleForgotPassword(action) {
    try{
        const email = action.payload;
        const data = yield call(ForgotPasswordAPI.forgotPassword, email);
        yield put(forgotPasswordSuccess(data));
         // Show success message
        notify("success", "Reset Password Link sent to your email!");
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(forgotPasswordFailure(errorMessage));
        notify("error", "Reset failed!", errorMessage);
    }
}

function* handleResetPassword(action) {
    try{
        
        const data = yield call(ForgotPasswordAPI.resetPassword, action.payload);
        yield put(resetPasswordSuccess(data));
        // Show success message
        notify("success", "Password Reset successful!");
    }
    catch(error)
    {
        const errorMessage = error.response?.data?.message || error.message
        yield put(resetPasswordFailure(errorMessage));
        notify("error", "Password Reset failed!", errorMessage);
    }
}

// Watcher Saga
export function* forgotPasswordSaga(){
    yield takeLatest(forgotPasswordRequest.type, handleForgotPassword);
    yield takeLatest(resetPasswordRequest.type, handleResetPassword)
}