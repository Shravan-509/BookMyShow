import { call, put, select, takeLatest, putResolve} from "redux-saga/effects";
import { axiosInstance } from "../../api";
import { notify } from "../../utils/notificationUtils";
import { logout, setUserData } from "../slices/authSlice";
import { 
    fetchProfileRequest, 
    fetchProfileSuccess, 
    fetchProfileFailure, 
    updateProfileRequest, 
    updateProfileSuccess, 
    updateProfileFailure,
    changePasswordRequest, 
    changePasswordSuccess,
    changePasswordFailure,  
    requestEmailChangeRequest, 
    requestEmailChangeSuccess,
    requestEmailChangeFailure,      
    verifyEmailChangeRequest, 
    verifyEmailChangeSuccess, 
    verifyEmailChangeFailure,
    toggle2FARequest,
    toggle2FASuccess,
    toggle2FAFailure, 
    deleteAccountRequest, 
    deleteAccountSuccess,
    deleteAccountFailure,
    showReauthenticationModal, 
    
} from "../slices/profileSlice";


// Profile API Calls
const fetchProfileAPI = async() => {
    try 
    {
        const response = await axiosInstance.get("/users/profile");
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch profile';
        throw new Error(message);
    }
}

const updateProfileAPI = async(profileData) => {
    try 
    {
        const response = await axiosInstance.put("/users/update-profile", profileData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to update profile';
        throw new Error(message);
    }
}

const changePasswordAPI = async(passwordData) => {
    try 
    {
        const response = await axiosInstance.put("/users/change-password", passwordData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to change password';
        throw new Error(message);
    }
}

const requestEmailChangeAPI = async(emailData) => {
    try 
    {
        const response = await axiosInstance.post("/users/request-email-change", emailData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to request email change';
        throw new Error(message);
    }
}

const verifyEmailChangeAPI = async(verificationData) => {
    try 
    {
        const response = await axiosInstance.post("/users/verify-email-change", verificationData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to verify email change';
        throw new Error(message);
    }
}

const toggle2FAAPI = async() => {
    try 
    {
        const response = await axiosInstance.put("/users/toggle-2fa");
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to toggle 2FA';
        throw new Error(message);
    }
}

const deleteAccountAPI = async(password) => {
    try 
    {
        const response = await axiosInstance.delete("/users/delete-account", {data: {password}});
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete account';
        throw new Error(message);
    }
}

// Worker Sagas
function* fetchProfileSaga() {
    try{ 
            const response = yield call(fetchProfileAPI);
            if(response.success)
            {
                yield put(fetchProfileSuccess(response.user));
                // Show success message
                notify("success", response.message);
    
                // Also update the auth state with fresh user data
                yield put(setUserData(response.user));
            }
            else
            {
                yield put(fetchProfileFailure(response.message));
                notify("warning", "Failed to update profile", response.message);
            }        
        }
        catch(error)
        {
            yield put(fetchProfileFailure(error.message));
            notify("error", "Profile fetch error. Please try again.", error?.message);
            
            // If unauthorized, logout user
            if (error?.message.includes("Unauthorized")) 
            {
                yield put(logout())
            }
        }
}

function* updateProfileSaga(action) {
    try{ 
            const response = yield call(updateProfileAPI, action.payload);
            if(response.success)
            {
                yield put(updateProfileSuccess(response.user));
                // Show success message
                notify("success", response.message);
    
                // Also update the auth state with fresh user data
                yield put(setUserData(response.user));
            }
            else
            {
                yield put(updateProfileFailure(response.message));
                notify("warning", "Failed to update profile", response.message);
            }        
        }
        catch(error)
        {
            yield put(updateProfileFailure(error.message));
            notify("error", "Profile update error. Please try again.", error?.message);
        }
}

function* changePasswordSaga(action) {
    try{ 
            const response = yield call(changePasswordAPI, action.payload);
            if(response.success)
            {
                yield put(changePasswordSuccess());

                //Checks if re-authentication is required
                if(response.requiresReauth)
                {
                   // Show re-authentication modal through Redux state
                    yield put(showReauthenticationModal({message: response.message}));
                }
                else
                {
                    // Show success message
                    notify("success", response.message);
                }
            }
            else
            {
                yield put(changePasswordFailure(response.message));
                notify("warning", "Failed to change password", response.message);
            }        
        }
        catch(error)
        {
            yield put(changePasswordFailure(error.message));
            notify("error", "Password change error. Please try again.", error?.message);
        }
}

function* requestEmailChangeSaga(action) {
    try{ 
            const response = yield call(requestEmailChangeAPI, action.payload.newEmail);
            if(response.success)
            {
                
                yield put(
                    requestEmailChangeSuccess({
                        newEmail: action.payload.newEmail,
                        message: response?.message
                    })
                );

                // Show success message
                notify("success", response.message);
            }
            else
            {
                yield put(requestEmailChangeFailure(response.message));
                notify("warning", "Failed to request email change", response.message);
            }        
        }
        catch(error)
        {
            yield put(requestEmailChangeFailure(error.message));
            notify("error", "Email change request error. Please try again.", error?.message);
        }
}


function* verifyEmailChangeSaga(action) {
    try{ 
            const response = yield call(verifyEmailChangeAPI, action.payload);
            if(response.success)
            {
                const newEmail = response.data.email;
                yield put(
                    verifyEmailChangeSuccess({
                        email: newEmail,
                    })
                );

                // Checks if re-authentication is required
                if(response.requiresReauth)
                {
                     // Show re-authentication modal through Redux state
                    yield put(showReauthenticationModal({message: response.message}));
                }
                else
                {
                    // Update Auth state with new Email
                    const currentUser = yield select((state) => state.auth.user);
                    yield put(setUserData({ ...currentUser, email: newEmail }));
                }

                // Show success message
                notify("success", response.message);
            }
            else
            {
                yield put(verifyEmailChangeFailure(response.message));
                notify("warning", "Failed to verify email change", response.message);
            }        
        }
        catch(error)
        {
            yield put(verifyEmailChangeFailure(error.message));
            notify("error", "Email change verification error. Please try again.", error?.message);
        }
}

function* toggle2FASaga() {
    try{ 
            const response = yield call(toggle2FAAPI);
            if(response.success)
            {
                const twoFactorStatus = response.twoFactorEnabled
                yield put(
                    toggle2FASuccess({
                        twoFactorEnabled : twoFactorStatus
                    })
                );

                //Update Auth state
                const currentUser = yield select((state) => state.auth.user);
                yield putResolve(setUserData({ ...currentUser, twoFactorEnabled: twoFactorStatus }));

                 // Show success message
                notify("success", response.message);
            }
            else
            {
                yield put(toggle2FAFailure(response.message));
                notify("warning", "Failed to toggle 2FA", response.message);
            }        
        }
        catch(error)
        {
            yield put(toggle2FAFailure(error.message));
            notify("error", "2FA toggle error. Please try again.", error?.message);
        }
}

function* deleteAccountSaga(action) {
    try{ 
            const response = yield call(deleteAccountAPI, action.payload.password);
            if(response.success)
            {
                yield put(deleteAccountSuccess());
                // Show success message
                notify("success", response.message);

                // Logout user after successful deletion
                yield put(logout())
            }
            else
            {
                yield put(deleteAccountFailure(response.message));
                notify("warning", "Failed to delete account", response.message);
            }        
        }
        catch(error)
        {
            yield put(deleteAccountFailure(error.message));
            notify("error", "Account deletion error", error?.message);
        }
}

// Watcher Saga
export function* profileSaga(){
    yield takeLatest(fetchProfileRequest.type, fetchProfileSaga);
    yield takeLatest(updateProfileRequest.type, updateProfileSaga);
    yield takeLatest(changePasswordRequest.type, changePasswordSaga);
    yield takeLatest(requestEmailChangeRequest.type, requestEmailChangeSaga);
    yield takeLatest(verifyEmailChangeRequest.type, verifyEmailChangeSaga);
    yield takeLatest(toggle2FARequest.type, toggle2FASaga);
    yield takeLatest(deleteAccountRequest.type, deleteAccountSaga);
}