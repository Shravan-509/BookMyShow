import { takeLatest, put, call } from "redux-saga/effects";
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