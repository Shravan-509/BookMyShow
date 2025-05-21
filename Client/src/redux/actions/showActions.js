import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../api/index";

// Add a Show
export const addShow = createAsyncThunk("/shows/addShow", async (payload, thunkAPI) => {
    try 
    {
        const response = await axiosInstance.post('/shows', payload);
        return response?.data;
    } 
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Add a Show");
    }
});

// Update a Show
export const updateShow = createAsyncThunk("/shows/updateShow", async ({id, payload}, thunkAPI) => {
    try 
    {
        const response = await axiosInstance.patch(`/shows/${id}`, payload);
        return response?.data;
    }
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Update a Show");
    }
});

// Delete a Show
export const deleteShow = createAsyncThunk("/shows/deleteShow", async (id, thunkAPI) => {
    try 
    {
        const response = await axiosInstance.delete(`/shows/${id}`);
        return response?.data;
    }
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Delete a Show");
    }
});

//Get a Show By Id
export const getShowsById = createAsyncThunk("/shows/getShowById", async (id, thunkAPI)=> {
    try 
    {
        const response = await axiosInstance.get(`/shows/${id}`);
        return response?.data;
    }
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Fetch a Show By Id");
    }
});

//Get a Show By Theatre Id
export const getShowsByTheatre = createAsyncThunk("/shows/getShowByTheatreId", async (id, thunkAPI) => {
    try 
    {
        const response = await axiosInstance.get(`/shows/theatre/${id}`);
        return response?.data;
    }
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Add a Show");
    }
});

//Get Theatres By Movie
export const getAllTheatresByMovies = createAsyncThunk("/shows/getTheatresByMovie", async (payload, thunkAPI) => {
    try {
        const response = await axiosInstance.post('/shows/theatres/movie', payload);
        return response?.data;
    }
    catch (error) 
    {
        return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Add a Show");
    }
});