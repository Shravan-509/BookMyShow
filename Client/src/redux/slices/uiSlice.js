import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    activeTab: "login",
    loginError: "",
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
        }
    }
});

//Export actions
export const {setActiveTab, setLoginError, clearLoginError} = uiSlice.actions;

//Export selectors
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectLoginError = (state) => state.ui.loginError;

export default uiSlice.reducer;