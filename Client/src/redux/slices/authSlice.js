import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    user : null,
    token: null,
    isAuthenticated: false,
    loading: false,
    checkingAuth: true, // New state to track initial auth check
    error: null
};

const authSlice = createSlice({
    name : "auth",
    initialState,
    reducers: {
        // Check auth status
        checkAuthStatus: (state) => {
            state.checkingAuth = true
        },
        authStatusChecked: (state, action) => {
            state.checkingAuth = false
            state.isAuthenticated = action.payload.isAuthenticated
            state.user = action.payload.user || null
            state.token = action.payload.token || null
        },

        // Login actions
        loginRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        loginSuccess: (state, action) => {
            state.loading = false
            state.isAuthenticated = true
            state.user = action.payload.user
            state.token = action.payload.token 
            state.error = null
        },
        loginFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Signup actions
        signupRequest: (state, action) => {
            state.loading = true
            state.error = null
        },
        signupSuccess: (state, action) => {
            state.loading = false
            state.error = null
        },
        signupFailure: (state, action) => {
            state.loading = false
            state.error = action.payload
        },

        // Logout Action
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
          },

        // Set User Data
        setUserData: (state, action) => {
            state.user = action.payload
        },

        // Clear Errors
        clearErrors: (state) => {
            state.error = null
        }
    }
    
});

export const {
    checkAuthStatus,
    authStatusChecked,
    loginRequest,
    loginSuccess,
    loginFailure,
    signupRequest,
    signupSuccess,
    signupFailure,
    logout,
    setUserData,
    clearErrors
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectisAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;


// Export selectors
export default authSlice.reducer;