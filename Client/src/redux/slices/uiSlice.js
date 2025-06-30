import {createSlice} from "@reduxjs/toolkit";

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
        clearLoginError: (state, action) => {
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

//Export selectors
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectLoginError = (state) => state.ui.loginError;
export const selectShowForgotPasswordModal = (state) => state.ui.showForgotPasswordModal;

export default uiSlice.reducer;