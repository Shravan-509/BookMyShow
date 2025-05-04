import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/index";

export const fetchUser = createAsyncThunk("/users", async (window = 'day') => {
    try{
        const response = await axiosInstance.get("/users");
        return response.data; //This will be passed to extraReducers in slice
    }
    catch(error)
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to fetch User Info");
    }
})