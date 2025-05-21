import {createSlice} from "@reduxjs/toolkit";
import { userInfo,userLogout } from "../actions/userActions";

const userSlice = createSlice({
    name : "user",
    initialState: {
        user : null,
        loading: true,
        error: null
    },
    reducers: {
    },
    extraReducers: (builder) => {
        builder
        .addCase(userInfo.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(userInfo.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(userInfo.rejected, (state, action) => {
            state.user = null,
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(userLogout.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(userLogout.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(userLogout.rejected, (state, action) => {
            state.user = null,
            state.loading = false;
            state.error = action.payload;
        })
    }
});

// export const {logout} = authSlice.actions;
export default userSlice.reducer;