import {createSlice} from "@reduxjs/toolkit";
import { createSelector } from "reselect";

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
        loginRequest: (state) => {
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
        signupRequest: (state) => {
            state.loading = true
            state.error = null
        },
        signupSuccess: (state) => {
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
            state.checkingAuth = false;
          },

        // Set User Data
        setUserData: (state, action) => {
            state.user = action.payload
        },

        // Clear Errors
        clearErrors: (state) => {
            state.error = null
        },

        setLoading: (state) =>{
            state.loading = false
        }
    },
    extraReducers: (builder) => {
        builder.addCase("persist/REHYDRATE", (state) => {
            state.checkingAuth = false; // 💡 mark auth check complete
        });
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
    clearErrors,
    setLoading
} = authSlice.actions;

// Base selector
const selectAuthState = (state) => state.auth;

// Memoized selectors using reselect (prevent unnecessary re-renders)
export const selectAuth = createSelector([selectAuthState], (auth) => auth);
export const selectUser = createSelector([selectAuthState], (auth) => auth.user);
export const selectisAuthenticated = createSelector([selectAuthState], (auth) => auth.isAuthenticated);
export const selectAuthLoading = createSelector([selectAuthState], (auth) => auth.loading);
export const selectAuthError = createSelector([selectAuthState], (auth) => auth.error);
export const selectCheckingAuth = createSelector([selectAuthState], (auth) => auth.checkingAuth);

// Complex selector for authentication readiness
export const selectAuthReady = createSelector(
  [selectisAuthenticated, selectCheckingAuth],
  (isAuthenticated, checkingAuth) => !checkingAuth && isAuthenticated
);

// Export reducer
export default authSlice.reducer;