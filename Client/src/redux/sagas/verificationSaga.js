import { takeLatest, put, call, delay, select, fork } from "redux-saga/effects"
import { axiosInstance } from "../../api";
import {
    verifyEmailRequest, 
    verifyEmailSuccess, 
    verifyEmailFailure,   
    verifyTwoFactorRequest, 
    verifyTwoFactorSuccess,
    verifyTwoFactorFailure, 
    reverifyAccountRequest, 
    reverifyAccountFailure, 
    reverifyAccountSuccess, 
    resendCodeRequest, 
    resendCodeFailure,
    resendCodeSuccess, 
    decrementCountdown
} from "../slices/verificationSlice";
import { setActiveTab } from "../slices/uiSlice";
import { message } from "antd";
import { checkAuthStatus, loginSuccess } from "../slices/authSlice";

//API Calls
const verifyEmailApi = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/verify-email", payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data.message || "Email Verification Failed";
        throw new Error(message);
    }
};

const verifyTwoFactorApi = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/verify-2fa", payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data.message || "Two Factor Authentication Failed";
        throw new Error(message);
    }
};

const reverifyAccountApi = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/request-reverification", payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data.message || "Reverification Request Failed";
        throw new Error(message);
    }
};

const resendCodeAi = async (type, payload) => {
    try {
        const endpoint = type === "email" ? "/auth/resend-verification" : "/auth/resend-2fa"
        const response = await axiosInstance.post(endpoint, payload);
        return response.data;
    } catch (error) {
        const message = error.response?.data.message || "Failed to resend code";
        throw new Error(message);
    }
};

//Worker Sagas
function* handleVerifyEmail(action) {
    try {
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const data = yield call(verifyEmailApi, {
            userId: tempUserId,
            code: action.payload.code
        })

        yield put(verifyEmailSuccess());

        //Reset and go nback to login
        yield put(setActiveTab("login"));

        //Show success message
        message.success("Email verified successfully!")
    } catch (error) {
        yield put(verifyEmailFailure(error.message));
        message.error(error.message || "Verification failed. Please try again.")
    }
}

function* handleVerifyTwoFactor(action) {
    try {
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const data = yield call(verifyTwoFactorApi, {
            userId: tempUserId,
            code: action.payload.code
        })

        yield put(verifyTwoFactorSuccess());

        //Store the token and update the Auth status
        yield put(loginSuccess({ token: data.token, user: null}));

         // ✅ Immediately validate and populate user
         yield put(checkAuthStatus()); 

        //Show success message
        message.success("Login successful!")
    } catch (error) {
        yield put(verifyTwoFactorFailure(error.message));
        message.error(error.message || "Verification failed. Please try again.")
    }
}

function* handleReverifyAccount(action) {
    try {
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const data = yield call(reverifyAccountApi, {
           email: action.payload.email
        })

        yield put(reverifyAccountSuccess({
            email: action.payload.email,
            userId: data.userId
        }));

        //Start countdown for resend button
        yield put(resendCodeRequest({ type: "email"}));

        //Show success message
        message.success("Verification code sent to your email!")
    } catch (error) {
        yield put(reverifyAccountFailure(error.message));
        message.error(error.message || "Reverification request failed. Please try again.")
    }
}


function* handleResendCode(action) {
    try {
        const {type} = action.payload;
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const verificationEmail = yield select((state) => state.verification.verificationEmail);
        
        yield call(resendCodeAi, type, {
            userId: tempUserId,
            email: verificationEmail
        })

        yield put(resendCodeSuccess())

        //Start countdown 
        yield fork(handleCountdown);

        //Show success message
        message.success("Verification code resent to your email!")
    } catch (error) {
        yield put(resendCodeFailure(error.message));
        message.error(error.message || "Failed to resend code. Please try again.")
    }
}

function* handleCountdown(){
    try {
        // Run countdown for 60 seconds
        for(let i = 60; i > 0; i--)
        {
            yield put(decrementCountdown())
            yield delay(1000)
        }
    } catch (error) {
        console.error("Countedoen error:". error)
    }
}

//watcher Saga
// Watcher Saga
export function* verificationSaga(){
    yield takeLatest(verifyEmailRequest.type, handleVerifyEmail)
    yield takeLatest(verifyTwoFactorRequest.type, handleVerifyTwoFactor);
    yield takeLatest(reverifyAccountRequest.type, handleReverifyAccount)
    yield takeLatest(resendCodeRequest.type, handleResendCode)
}