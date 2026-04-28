import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

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
        verifyEmailRequest : (state) => {
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
        verifyTwoFactorRequest : (state) => {
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
        reverifyAccountRequest : (state) => {
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
        resendCodeRequest : (state) => {
            state.loading = true
            state.error = null
            state.resendDisabled = true
            state.countdown = 60
        },
        resendCodeSuccess: (state) => {
            state.loading = false
           // Keep resendDisabled true until countdown finishes
        },
        resendCodeFailure: (state, action) => {
            state.loading = false
            state.resendDisabled = false
            state.countdown = 0
            state.error = action.payload
        },

        // Countdown management
        setResendCountdown: (state, action) => {
            state.resendDisabled = true
            state.countdown = action.payload
        },
        decrementCountdown: (state) => {
            if (state.countdown > 0) 
            {
                state.countdown -= 1
            }
            if (state.countdown === 0)
            {
                state.resendDisabled = false
            }
        },
        setCountdownTimer: (state, action) => {
           state.countdownTimer = action.payload
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
    resetVerificationState,
    setResendCountdown, // New action
} = verificationSlice.actions;

// Base selector
const selectVerificationState = (state) => state.verification;

// Memoized selectors using reselect
export const selectVerification = createSelector([selectVerificationState], (verification) => verification);
export const selectVerificationEmail = createSelector([selectVerificationState], (verification) => verification.verificationEmail);
export const selectTempUserId = createSelector([selectVerificationState], (verification) => verification.tempUserId);
export const selectShowEmailVerificationModal = createSelector([selectVerificationState], (verification) => verification.showEmailVerificationModal);
export const selectShowTwoFactorAuthModal = createSelector([selectVerificationState], (verification) => verification.showTwoFactorAuthModal);
export const selectShowReverifyAccountModal = createSelector([selectVerificationState], (verification) => verification.showReverifyAccountModal);
export const selectResendDisabled = createSelector([selectVerificationState], (verification) => verification.resendDisabled);
export const selectCountdown = createSelector([selectVerificationState], (verification) => verification.countdown);
export const selectVerificationLoading = createSelector([selectVerificationState], (verification) => verification.loading);
export const selectVerificationError = createSelector([selectVerificationState], (verification) => verification.error);

// Complex memoized selector
export const selectAnyModalOpen = createSelector(
  [selectShowEmailVerificationModal, selectShowTwoFactorAuthModal, selectShowReverifyAccountModal],
  (email, twoFactor, reverify) => email || twoFactor || reverify
);

export default verificationSlice.reducer;