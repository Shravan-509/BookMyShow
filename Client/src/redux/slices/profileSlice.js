import { createSlice } from "@reduxjs/toolkit";

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

// Export selectors
export const selectProfile = (state) => state.profile.profile;
export const selectProfileLoading = (state) => state.profile.loading;
export const selectProfileError = (state) => state.profile.error;
export const selectProfileUpdateLoading = (state) => state.profile.profileUpdateLoading;
export const selectProfileUpdateError = (state) => state.profile.profileUpdateError;
export const selectPasswordChangeLoading = (state) => state.profile.passwordChangeLoading;
export const selectPasswordChangeError = (state) => state.profile.passwordChangeError;
export const selectEmailChangeLoading = (state) => state.profile.emailChangeLoading;
export const selectEmailChangeError = (state) => state.profile.emailChangeError;
export const selectShowEmailVerificationModal = (state) => state.profile.showEmailVerificationModal;
export const selectPendingEmailChange = (state) => state.profile.pendingEmailChange;
export const selectSecurityLoading = (state) => state.profile.securityLoading;
export const selectSecurityError = (state) => state.profile.securityError;
export const selectDeleteAccountLoading = (state) => state.profile.deleteAccountLoading;
export const selectDeleteAccountError = (state) => state.profile.deleteAccountError;
export const selectShowReauthModal = (state) => state.profile.showReauthModal
export const selectReauthMessage = (state) => state.profile.reauthMessage

export default profileSlice.reducer;