import {createSlice} from "@reduxjs/toolkit";
import { fetchUser } from "../actions/authSlice";

const authSlice = createSlice({
    name : "auth",
    initialState: {
        user : null,
        loading: true,
        error: null
    },
    reducers: {
        logout(state) {
            state.user = null;
            state.error = null;
          },
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(fetchUser.rejected, (state, action) => {
            state.user = null,
            state.loading = false;
            state.error = action.payload;
        })
    }
});

export const {logout} = authSlice.actions;
export default authSlice.reducer;