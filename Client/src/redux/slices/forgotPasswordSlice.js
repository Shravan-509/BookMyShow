import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    loading: false,
    resetLoading: false,
    error: null,
    resetError: null,
    emailSent: false,
    resetSuccess: false 
};

const forgotPasswordSlice = createSlice({
    name: "forgotPassword",
    initialState,
    reducers: {
        //Forgot Password Actions
        forgotPasswordRequest: (state) => {
            state.loading = true;
            state.error = null;
            state.emailSent = false;
        },
        forgotPasswordSuccess: (state) => {
            state.loading = false;
            state.emailSent = true;
            state.error = null; 
        },
        forgotPasswordFailure: (state, action) => {
            state.loading = false;
            state.emailSent = false;
            state.error = action.payload; 
        },

        //Reset Password Actions
        resetPasswordRequest: (state) => {
            state.resetLoading = true;
            state.resetError = null;
            state.resetSuccess = false;
        },
        resetPasswordSuccess: (state) => {
            state.resetLoading = false;
            state.resetError = null;
            state.resetSuccess = true;
        },
        resetPasswordFailure: (state, action) => {
            state.resetLoading = false;
            state.resetError = action.payload;
            state.resetSuccess = false;
        },

        //Clear Actions
        clearForgotPasswordError: (state) => {
            state.error = null
        },
        clearResetPasswordError: (state) => {
            state.resetError = null
        },
        clearEmailSent: (state) => {
            state.emailSent = false
        },
        resetForgotPasswordState: (state) => {
            state.loading = false;
            state.resetLoading = false;
            state.error = null;
            state.resetError = null;
            state.emailSent = false;
            state.resetSuccess = false;
        }
    }
});

//Export actions
export const {
    forgotPasswordRequest,
    forgotPasswordSuccess,
    forgotPasswordFailure,
    resetPasswordRequest,
    resetPasswordSuccess,
    resetPasswordFailure,
    clearForgotPasswordError,
    clearResetPasswordError,
    resetForgotPasswordState,
    clearEmailSent
} = forgotPasswordSlice.actions;

// Base selector
const selectForgotPasswordState = (state) => state.forgotPassword;

// Memoized selectors using reselect
export const selectForgotPasswordLoading = createSelector([selectForgotPasswordState], (fp) => fp.loading);
export const selectResetPasswordLoading = createSelector([selectForgotPasswordState], (fp) => fp.resetLoading);
export const selectForgotPasswordError = createSelector([selectForgotPasswordState], (fp) => fp.error);
export const selectResetPasswordError = createSelector([selectForgotPasswordState], (fp) => fp.resetError);
export const selectEmailSent = createSelector([selectForgotPasswordState], (fp) => fp.emailSent);
export const selectResetSuccess = createSelector([selectForgotPasswordState], (fp) => fp.resetSuccess);

// Complex memoized selectors
export const selectPasswordFlowComplete = createSelector(
  [selectEmailSent, selectResetSuccess],
  (emailSent, resetSuccess) => emailSent && resetSuccess
);

export const selectAnyPasswordError = createSelector(
  [selectForgotPasswordError, selectResetPasswordError],
  (forgotError, resetError) => forgotError || resetError
);

export default forgotPasswordSlice.reducer;