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
    decrementCountdown,
    setResendCountdown
} from "../slices/verificationSlice";
import { setActiveTab } from "../slices/uiSlice";
import { message } from "antd";
import { checkAuthStatus, loginSuccess } from "../slices/authSlice";
import { notify } from "../../utils/notificationUtils";

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

const resendCodeApi = async (type, payload) => {
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
        // Get both tempUserId from state and email/code from action
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const verificationEmail = yield select((state) => state.verification.verificationEmail);

        const { code, email } = action.payload;

        //Prepare Verification data
        const verificationData = { code }

        // If we have tempUserId from current session, use it
        if (tempUserId) 
        {
            verificationData.userId = tempUserId
        }
        // If we have email (either from action or state), use it
        else if (email || verificationEmail) 
        {
            verificationData.email = email || verificationEmail
        }
        // If neither is available, this is an error
        else 
        {
            throw new Error("Unable to verify: missing user identification. Please try the verification process again.")
        }

        const response = yield call(verifyEmailApi, verificationData);

        if(response.success)
        {
            yield put(verifyEmailSuccess());
            yield put(setActiveTab("login")); //Reset and go back to login
            notify("success", "Email verified successfully! You can now log in.");
        }
        else
        {
            yield put(verifyEmailFailure(response.message));
            notify("warning", "Email Verification Failure", response.message);
        }

    } catch (error) {
        yield put(verifyEmailFailure(error.message));
        notify("error", "Error in Email Verification. Please try again.", error?.message);  
    }
}

function* handleVerifyTwoFactor(action) {
    try {
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const verificationEmail = yield select((state) => state.verification.verificationEmail)

        const { code, email } = action.payload;

        // Prepare verification data
        const verificationData = { code }

        // For 2FA, we should have tempUserId from the login flow
        if (tempUserId) 
        {
            verificationData.userId = tempUserId;
        }
        else if (email || verificationEmail)
        {
            verificationData.email = email || verificationEmail;
        } 
        else 
        {
            throw new Error("Session expired. Please log in again.")
        }

        const data = yield call(verifyTwoFactorApi, verificationData);

        if(data.success)
        {
            yield put(verifyTwoFactorSuccess());

            //Store the token and update the Auth status
            yield put(loginSuccess({ token: data.token, user: null}));

            // ✅ Immediately validate and populate user
            yield put(checkAuthStatus()); 

            //Show success message
            notify("success", "Login successful!");
        }
        else
        {
            yield put(verifyTwoFactorFailure(data.message));
            notify("warning", "Two-Factor Authentication Failure", data.message);
        }

    } catch (error) {
        yield put(verifyTwoFactorFailure(error.message));
        notify("error", "Error in Two-Factor Authentication. Please try again.", error?.message); 
    } 
}

function* handleReverifyAccount(action) {
    try {
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const data = yield call(reverifyAccountApi, {
           email: action.payload.email
        })

        if(data.success)
        {
            yield put(reverifyAccountSuccess({
                email: action.payload.email,
                userId: data.userId
            }));

            //Start countdown for resend button
            yield put(setResendCountdown(60));
            yield fork(handleCountdown)

            //Show success message
            notify("success", "Verification code sent to your email!");
        }
        else
        {
            yield put(reverifyAccountFailure(data.message));
            notify("warning", "Reverification Failure", data.message);
        }

    } catch (error) {
        yield put(reverifyAccountFailure(error.message));
        notify("error", "Error in Reverification request. Please try again.", error?.message);
    }
}

function* handleResendCode(action) {
    try {
        const {type} = action.payload;
        const tempUserId = yield select((state) => state.verification.tempUserId);
        const verificationEmail = yield select((state) => state.verification.verificationEmail);
        
        // Prepare resend data
        let resendData = {}

        if (tempUserId && verificationEmail) 
        {
            resendData = {
                userId: tempUserId,
                email: verificationEmail,
            }
        } 
        else if (verificationEmail) 
        {
            // If no userId but we have email, backend can look up user
            resendData = {
                email: verificationEmail,
            }
        } 
        else 
        {
            throw new Error("Unable to resend code: missing user information")
        }

        const response = yield call(resendCodeApi, type, resendData);

        if(response.success)
        {
            yield put(resendCodeSuccess())

            //Start countdown 
            yield put(setResendCountdown(60))
            yield fork(handleCountdown);

            //Show success message
            notify("success", "Verification code resent to your email!");
        }
        else
        {
            yield put(resendCodeFailure(response.message));
            notify("warning", "Code Resend Failure", response.message);
        }
        
    } catch (error) {
        yield put(resendCodeFailure(error.message));
        notify("error", "Error in Code Resend. Please try again.", error?.message);
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
        console.error("Countdown error:" + error)
    }
}

// Watcher Saga
export function* verificationSaga(){
    yield takeLatest(verifyEmailRequest.type, handleVerifyEmail)
    yield takeLatest(verifyTwoFactorRequest.type, handleVerifyTwoFactor);
    yield takeLatest(reverifyAccountRequest.type, handleReverifyAccount)
    yield takeLatest(resendCodeRequest.type, handleResendCode)
}