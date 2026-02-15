// import { createAsyncThunk } from "@reduxjs/toolkit";
// import { axiosInstance } from "../../api/index";

// // Get all Movies
// export const getMovies = createAsyncThunk("/movies/getMovies", async (_, thunkAPI) => {
//     try 
//     {
//         const response = await axiosInstance.get("/movies");
//         return response?.data;
//     } 
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to fetch Movies");
//     }
// });

// // Add a Movie
// export const addMovie = createAsyncThunk("/movies/addMovie", async (payload, thunkAPI) => {
//     try {
//         const response = await axiosInstance.post('/movies', payload);
//         return response?.data;
//     } 
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Add a Movie");
//     }
// });

// // Update a Movie
// export const updateMovie = createAsyncThunk("/movies/updateMovie", async ({id, payload}, thunkAPI) => {
//     try {
//         const response = await axiosInstance.patch(`/movies/${id}`, payload);
//         return response?.data;
//     } 
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to fetch Movies");
//     }
// });

// // Delete a Movie
// export const deleteMovie = createAsyncThunk("/movies/deleteMovie", async (id, thunkAPI) => {
//     try {
//         const response = await axiosInstance.delete(`/movies/${id}`);
//         return response?.data;
//     } 
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to fetch Movies");
//     }
// });

