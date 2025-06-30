import { takeLatest, put, call, select } from "redux-saga/effects";
import Cookies from "js-cookie";
import { axiosInstance } from "../../api/index";
import { 
    authStatusChecked, 
    checkAuthStatus, 
    loginFailure, 
    loginRequest, 
    loginSuccess, 
    logout, 
    setUserData, 
    signupFailure, 
    signupRequest, 
    signupSuccess 
} from "../slices/authSlice";
import { setLoginError } from "../slices/uiSlice";
import { 
    setShowEmailVerificationModal, 
    setShowTwoFactorAuthModal, 
    setTempUserId, 
    setVerificationEmail
} from "../slices/verificationSlice";
import { notify } from "../../utils/notificationUtils";


// Account Login API calls
const loginApi = async (credentials) => {
    try {
        const response = await axiosInstance.post("/auth/login", credentials);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Login failed';
        throw new Error(message);
    }
};

export const signupApi = async (userData) => {
    try {
        const response = await axiosInstance.post("/auth/register", userData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Registration failed';
        throw new Error(message);
    }
};

export const checkAuthApi = async () => {
    try {
        const response = await axiosInstance.get("/users/profile");
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Not Authenticated';
        throw new Error(message);
    }
};

const logoutApi = async () => {
    try {
        const response = await axiosInstance.post("/auth/logout");
        return response.data;
    } catch (error) {
        const message = error.response?.data.message || "Login Failed";
        throw new Error(message);
    }
};

// Worker Sagas
function* handleCheckAuthStatus() {
    try{
        // Get user data with cookie
        const userData = yield call(checkAuthApi);

        //If successful user is authenticated
        yield put(
            authStatusChecked({
                isAuthenticated: true,
                token: Cookies.get("access_token"), // For State tracking, not for auth
                user: userData.user
            })
        )
    } catch (error) {
        // If error user is not Authenticated
        yield put(
            authStatusChecked({
                isAuthenticated: false,
                token: false, 
                user: false
            })
        )
    }
}

function* handleLogin(action) {
    try{
        const data = yield call(loginApi, action.payload);
        
        if(data.requiresTwoFactor)
        {
            // Show 2FA verification screen
            yield put(setVerificationEmail(action.payload.email))
            yield put(setTempUserId(data.userId))
            yield put(setShowTwoFactorAuthModal(true))

            // Clear login error if any
            yield put(setLoginError(""))
        }
        else
        {
            // User is fullly authenticated
            yield put(loginSuccess({token: data.access_token, user: data.user}));

            // ✅ Immediately validate and populate user
            yield put(checkAuthStatus()); 

            // Show success message
            notify("success", "Login Successful!");
        }
        
    }
    catch(error)
    {
        // Check iuf the erro is due to Unverified Account
        if(error.message.includes("UNVERFIED_ACCOUNT"))
        {
            yield put(setLoginError("Your account is not verified. Please verify your email to continue."))
            yield put(setVerificationEmail(action.payload.email))
        }
        else
        {
            yield put(loginFailure(error.message));
            notify("error", "Login failed. Please try again", error.message);
        }
    }
}

function* handleSignup(action) {
    try{
        const data = yield call(signupApi, action.payload);
        yield put(signupSuccess());

        // Show Email verification screen
        yield put(setVerificationEmail(action.payload.email))
        yield put(setTempUserId(data.userId))
        yield put(setShowEmailVerificationModal(true))

        // Show success message
        notify("success", "Verification code sent to your email!");
    }
    catch(error)
    {
        yield put(signupFailure(error.message));
        notify("error", "Signup failed. Please try again", error.message);
    }
}

function* handleLogout(action) {
    try{
        // Call logout API to clear the server-side session or cookie
        yield call(logoutApi);

        //show success message
        notify("success", "Logged out Successfully");
    }
    catch(error)
    {
        notify("error", "Logout failed", error.message);
    }
}

// Watcher Saga
export function* authSaga(){
    yield takeLatest(checkAuthStatus.type, handleCheckAuthStatus)
    yield takeLatest(loginRequest.type, handleLogin);
    yield takeLatest(signupRequest.type, handleSignup)
    yield takeLatest(logout.type, handleLogout)
}