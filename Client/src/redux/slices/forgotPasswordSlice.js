import {createSlice} from "@reduxjs/toolkit";

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

// Export selectors
export const selectForgotPasswordLoading = (state) => state.forgotPassword.loading
export const selectResetPasswordLoading = (state) => state.forgotPassword.resetLoading
export const selectForgotPasswordError = (state) => state.forgotPassword.error
export const selectResetPasswordError = (state) => state.forgotPassword.resetError
export const selectEmailSent = (state) => state.forgotPassword.emailSent
export const selectResetSuccess = (state) => state.forgotPassword.resetSuccess

export default forgotPasswordSlice.reducer;