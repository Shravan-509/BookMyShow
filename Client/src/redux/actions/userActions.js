import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/index";


// Get User Info
export const userInfo = createAsyncThunk("/user/info", async (_, thunkAPI) => {
    try{
        const response = await axiosInstance.get("/users");
        return response.data; //This will be passed to extraReducers in slice
    }
    catch(error)
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Fetch User Info");
    }
})

// User Logout
export const userLogout = createAsyncThunk("/user/logout" , async (_, thunkAPI) => {
    try 
    {
        const response = await axiosInstance.post("/users/logout");
        return response.data;
    } 
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "User Logout Failed");
    }
});