import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    activeTab: "login",
    loginError: "",
    showForgotPasswordModal: false
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setActiveTab : (state, action) => {
            state.activeTab = action.payload
        },
        setLoginError: (state, action) => {
            state.loginError = action.payload
        },
        clearLoginError: (state) => {
            state.loginError = ""
        },
        setShowForgotPasswordModal: (state, action) => {
            state.showForgotPasswordModal = action.payload
        }
    }
});

//Export actions
export const {
    setActiveTab, 
    setLoginError, 
    clearLoginError,
    setShowForgotPasswordModal
} = uiSlice.actions;

// Base selector
const selectUiState = (state) => state.ui;

// Memoized selectors using reselect
export const selectActiveTab = createSelector([selectUiState], (ui) => ui.activeTab);
export const selectLoginError = createSelector([selectUiState], (ui) => ui.loginError);
export const selectShowForgotPasswordModal = createSelector([selectUiState], (ui) => ui.showForgotPasswordModal);

// Complex memoized selector
export const selectUiErrorExists = createSelector(
  [selectLoginError],
  (loginError) => !!loginError
);

export default uiSlice.reducer;