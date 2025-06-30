import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    verificationEmail: "",
    tempUserId: null,
    showEmailVerificationModal: false, 
    showTwoFactorAuthModal: false,
    showReverifyAccountModal: false,
    resendDisabled: false,
    countdown: 0,
    countdownTimer: null,
    loading: false,
    error: null    
};

const verificationSlice = createSlice({
    name: "verification",
    initialState,
    reducers: {
        // Email verify actions
        verifyEmailRequest : (state, action) => {
            state.loading = true
            state.error = null
        },
        verifyEmailSuccess: (state) => {
            state.loading = false
            state.showEmailVerificationModal= false
            state.error = null
        },
        verifyEmailFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Two-Factor Authentication actions
        verifyTwoFactorRequest : (state, action) => {
            state.loading = true
            state.error = null
        },
        verifyTwoFactorSuccess: (state) => {
            state.loading = false
            state.showTwoFactorAuthModal= false
            state.error = null
        },
        verifyTwoFactorFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Reverify Account actions
        reverifyAccountRequest : (state, action) => {
            state.loading = true
            state.error = null
        },
        reverifyAccountSuccess: (state, action) => {
            state.loading = false
            state.showReverifyAccountModal = false
            state.showEmailVerificationModal = true
            state.verificationEmail = action.payload.email
            state.tempUserId = action.payload.userId
            state.error = null
        },
        reverifyAccountFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Resend Verification Code actions
        resendCodeRequest : (state, action) => {
            state.resendDisabled = true
            state.countdown = 60
        },
        resendCodeSuccess: (state) => {
           // Keep resendDisabled true until countdown finishes
        },
        resendCodeFailure: (state, action) => {
            state.resendDisabled = false
            state.countdown = 0
            state.error = action.payload
        },

         // UI state actions
        setVerificationEmail : (state, action) => {
            state.verificationEmail = action.payload
        },
        setTempUserId: (state, action) => {
            state.tempUserId = action.payload
        },
        setShowEmailVerificationModal: (state, action) => {
            state.showEmailVerificationModal = action.payload
        },
        setShowTwoFactorAuthModal: (state, action) => {
            state.showTwoFactorAuthModal = action.payload
        },
        setShowReverifyAccountModal: (state, action) => {
            state.showReverifyAccountModal = action.payload
        },

        // Countdown actions
        decrementCountdown: (state, action) => {
            if(state.countdown > 0)
            {
                state.countdown -= 1
            }
            if(state.countdown === 0)
            {
                state.resendDisabled = false
            }
        },
        setCountdownTimer: (state, action) => {
           state.countdownTimer = action.payload
        },

        //Reset verification State
        resetVerificationState: (state) => {
           return {
                ...initialState,
                verificationEmail: state.verificationEmail
           }
        },
    }
});

//Export actions
export const {
    verifyEmailRequest,
    verifyEmailSuccess, 
    verifyEmailFailure,
    verifyTwoFactorRequest, 
    verifyTwoFactorSuccess,
    verifyTwoFactorFailure,
    reverifyAccountRequest,
    reverifyAccountSuccess,
    reverifyAccountFailure,
    resendCodeRequest,
    resendCodeSuccess,
    resendCodeFailure,
    setVerificationEmail,
    setTempUserId,
    setShowEmailVerificationModal,
    setShowTwoFactorAuthModal,
    setShowReverifyAccountModal,
    decrementCountdown,
    setCountdownTimer,
    resetVerificationState
} = verificationSlice.actions;

// Export selectors
export const selectVerification = (state) => state.verification
export const selectVerificationEmail = (state) => state.verification.verificationEmail
export const selectTempUserId = (state) => state.verification.tempUserId
export const selectShowEmailVerificationModal = (state) => state.verification.showEmailVerificationModal
export const selectShowTwoFactorAuthModal = (state) => state.verification.showTwoFactorAuthModal
export const selectShowReverifyAccountModal = (state) => state.verification.showReverifyAccountModal
export const selectResendDisabled = (state) => state.verification.resendDisabled
export const selectCountdown = (state) => state.verification.countdown
export const selectVerificationLoading = (state) => state.verification.loading
export const selectVerificationError = (state) => state.verification.error

export default verificationSlice.reducer;