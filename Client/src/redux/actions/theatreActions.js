// import { createAsyncThunk } from "@reduxjs/toolkit";
// import { axiosInstance } from "../../api/index";

// // Add a Theatre
// export const addTheatre = createAsyncThunk("/theatres/addTheatre", async (payload, thunkAPI) => {
//     try 
//     {
//         const response = await axiosInstance.post('/theatres', payload);
//         return response?.data;
//     } 
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Add a Theatre");
//     }
// });

// // Update a Theatre
// export const updateTheatre = createAsyncThunk("/theatres/updateTheatre", async ({id, payload}, thunkAPI) => {
//     try {
//         const response = await axiosInstance.patch(`/theatres/${id}`, payload);
//         return response?.data;
//     }
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Update a Theatre");
//     }
// });

// export const deleteTheatre = createAsyncThunk("/theatres/deleteTheatre", async (id, thunkAPI) => {
//     try {
//         const response = await axiosInstance.delete(`/theatres/${id}`);
//         return response?.data;
//     }
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Update a Theatre");
//     }
// });

// // TheatresByOwner & TheatresForAdmin merged to one dynamic to get Theatres info
// export const getTheatres = createAsyncThunk("/theatres/getTheatres", async (_, thunkAPI) => {
//     try 
//     {
//         const response = await axiosInstance.get("/theatres");
//         return response?.data;
//     }
//     catch (error) 
//     {
//         return thunkAPI.rejectWithValue(error.response?.data.message || "Failed to Fetch Theatres");
//     }
// });
