import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/index";

// Acccount Creation Use Cases
export const registerUser = createAsyncThunk("/register", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/register", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Account Creation Failed");
    }
});

export const verifyEmail = createAsyncThunk("/verifyEmail", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/verify-email", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Email Verification Failed");
    }
});

export const resendEmailVerification = createAsyncThunk("/resendEmail", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/resend-verification", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Resend Email Verification Failed");
    }
});

export const ReverifyEmail = createAsyncThunk("/reverifyEmail", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/request-reverification", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Reverify Email Verification Failed");
    }
});

// Account Login Use Cases
export const loginUser = createAsyncThunk("/login", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/login", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "User Login Failed");
    }
});

export const verify2FA = createAsyncThunk("/verify2FA", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/verify-2fa", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Two Factor Authentication Failed");
    }
});

export const Resend2FA = createAsyncThunk("/resend2FA", async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/resend-2fa", payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Resend Two Factor Authentication Failed");
    }
});

// Check User Authentication
export const fetchUser = createAsyncThunk("/users", async () => {
    try{
        const response = await axiosInstance.get("/users");
        return response.data; //This will be passed to extraReducers in slice
    }
    catch(error)
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Fetch User Info");
    }
})