import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    profile: null,
    loading: false,
    saving: false,
    error: null,

    // Profile update states
    profileUpdateLoading: false,
    profileUpdateError: null,

    // Password change states
    passwordChangeLoading: false,
    passwordChangeError: null,

    // Email change states
    emailChangeLoading: false,
    emailChangeError: null,
    showEmailVerificationModal: false,
    pendingEmailChange: null,

    // Security settings
    securityLoading: false,
    securityError: null,

    // Account deletion
    deleteAccountLoading: false,
    deleteAccountError: null,

    // Re-authentication modal
    showReauthModal: false,
    reauthMessage: "",
}

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        // Fetch Profile
        fetchProfileRequest: (state) => {
            state.loading = true
            state.error = null
        },
        fetchProfileSuccess: (state, action) => {
            state.loading = false
            state.profile = action.payload
            state.error = null
        },
        fetchProfileFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Update Profile
        updateProfileRequest: (state) => {
            state.profileUpdateLoading = true
            state.profileUpdateError = null
        },
        updateProfileSuccess: (state, action) => {
            state.profileUpdateLoading = false
            state.profile = { ...state.profile, ...action.payload }
            state.profileUpdateError = null
        },
        updateProfileFailure: (state, action) => {
            state.profileUpdateLoading = false
            state.profileUpdateError = action.payload
        },

        // Change Password
        changePasswordRequest: (state) => {
            state.passwordChangeLoading = true
            state.passwordChangeError = null
        },
        changePasswordSuccess: (state) => {
            state.passwordChangeLoading = false
            state.passwordChangeError = null
        },
        changePasswordFailure: (state, action) => {
            state.passwordChangeLoading = false
            state.passwordChangeError = action.payload
        },

        // Email Change
        requestEmailChangeRequest: (state) => {
            state.emailChangeLoading = true
            state.emailChangeError = null
        },
        requestEmailChangeSuccess: (state, action) => {
            state.emailChangeLoading = false
            state.showEmailVerificationModal = true
            state.pendingEmailChange = action.payload.email
            state.emailChangeError = null
        },
        requestEmailChangeFailure: (state, action) => {
            state.emailChangeLoading = false
            state.emailChangeError = action.payload
        },

        // Verify Email Change
        verifyEmailChangeRequest: (state) => {
            state.emailChangeLoading = true
            state.emailChangeError = null
        },
        verifyEmailChangeSuccess: (state, action) => {
            state.emailChangeLoading = false
            state.showEmailVerificationModal = false
            state.profile = { ...state.profile, email: action.payload.email }
            state.pendingEmailChange = null
            state.emailChangeError = null
        },
        verifyEmailChangeFailure: (state, action) => {
            state.emailChangeLoading = false
            state.emailChangeError = action.payload
        },

        // Toggle 2FA
        toggle2FARequest: (state) => {
            state.securityLoading = true
            state.securityError = null
        },
        toggle2FASuccess: (state, action) => {
            state.securityLoading = false
            state.profile = { ...state.profile, twoFactorEnabled: action.payload.twoFactorEnabled }
            state.securityError = null
        },
        toggle2FAFailure: (state, action) => {
            state.securityLoading = false
            state.securityError = action.payload
        },

        // Delete Account
        deleteAccountRequest: (state) => {
            state.deleteAccountLoading = true
            state.deleteAccountError = null
        },
        deleteAccountSuccess: (state) => {
            state.deleteAccountLoading = false
            state.deleteAccountError = null
        },
        deleteAccountFailure: (state, action) => {
            state.deleteAccountLoading = false
            state.deleteAccountError = action.payload
        },

        // Re-authentication Modal
        showReauthenticationModal: (state, action) => {
            state.showReauthModal = true
            state.reauthMessage = action.payload.message
        },
        hideReauthenticationModal: (state) => {
            state.showReauthModal = false
            state.reauthMessage = ""
        },

        // UI Actions
        setShowEmailVerificationModal: (state, action) => {
            state.showEmailVerificationModal = action.payload
        },

        clearProfileErrors: (state) => {
            state.error = null
            state.profileUpdateError = null
            state.passwordChangeError = null
            state.emailChangeError = null
            state.securityError = null
            state.deleteAccountError = null
        },

        resetProfileState: () => {
            return initialState
        }
    }
})

// Export actions
export const {
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
    hideReauthenticationModal,
    setShowEmailVerificationModal,
    clearProfileErrors,
    resetProfileState,
} = profileSlice.actions

// Base selector
const selectProfileState = (state) => state.profile;

// Memoized selectors using reselect
export const selectProfile = createSelector([selectProfileState], (profile) => profile.profile);
export const selectProfileLoading = createSelector([selectProfileState], (profile) => profile.loading);
export const selectProfileError = createSelector([selectProfileState], (profile) => profile.error);
export const selectProfileUpdateLoading = createSelector([selectProfileState], (profile) => profile.profileUpdateLoading);
export const selectProfileUpdateError = createSelector([selectProfileState], (profile) => profile.profileUpdateError);
export const selectPasswordChangeLoading = createSelector([selectProfileState], (profile) => profile.passwordChangeLoading);
export const selectPasswordChangeError = createSelector([selectProfileState], (profile) => profile.passwordChangeError);
export const selectEmailChangeLoading = createSelector([selectProfileState], (profile) => profile.emailChangeLoading);
export const selectEmailChangeError = createSelector([selectProfileState], (profile) => profile.emailChangeError);
export const selectShowEmailVerificationModal = createSelector([selectProfileState], (profile) => profile.showEmailVerificationModal);
export const selectPendingEmailChange = createSelector([selectProfileState], (profile) => profile.pendingEmailChange);
export const selectSecurityLoading = createSelector([selectProfileState], (profile) => profile.securityLoading);
export const selectSecurityError = createSelector([selectProfileState], (profile) => profile.securityError);
export const selectDeleteAccountLoading = createSelector([selectProfileState], (profile) => profile.deleteAccountLoading);
export const selectDeleteAccountError = createSelector([selectProfileState], (profile) => profile.deleteAccountError);
export const selectShowReauthModal = createSelector([selectProfileState], (profile) => profile.showReauthModal);
export const selectReauthMessage = createSelector([selectProfileState], (profile) => profile.reauthMessage);

// Complex memoized selectors
export const selectIsOperationInProgress = createSelector(
  [selectProfileUpdateLoading, selectPasswordChangeLoading, selectEmailChangeLoading, selectDeleteAccountLoading],
  (profileLoading, passwordLoading, emailLoading, deleteLoading) => 
    profileLoading || passwordLoading || emailLoading || deleteLoading
);

export default profileSlice.reducer;