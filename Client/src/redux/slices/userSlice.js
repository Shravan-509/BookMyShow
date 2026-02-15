import {createSlice} from "@reduxjs/toolkit";
// import { userInfo, userLogout } from "../actions/userActions";

const userSlice = createSlice({
    name : "user",
    initialState: {
        user: null,
        allUsers: [],
        loading: true,
        error: null,
    },
    reducers: {
        // Get User Bookings actions
        getAllUsersRequest: (state) => {
            state.loading = true
            state.error = null
        },
        getAllUsersSuccess: (state, action) => {
            state.loading = false
            state.allUsers = action.payload
            state.error = null
        },
       getAllUsersFailure: (state, action) => {
            state.loading = false
            state.allUsers = []
            state.error = action.payload
        }
    },
    // extraReducers: (builder) => {
    //     builder
    //     .addCase(userInfo.pending, (state) => {
    //         state.loading = true;
    //         state.error = null;
    //     })
    //     .addCase(userInfo.fulfilled, (state, action) => {
    //         state.loading = false;
    //         state.user = action.payload;
    //     })
    //     .addCase(userInfo.rejected, (state, action) => {
    //         state.user = null,
    //         state.loading = false;
    //         state.error = action.payload;
    //     })
    //     .addCase(userLogout.pending, (state) => {
    //         state.loading = true;
    //         state.error = null;
    //     })
    //     .addCase(userLogout.fulfilled, (state, action) => {
    //         state.loading = false;
    //         state.user = action.payload;
    //     })
    //     .addCase(userLogout.rejected, (state, action) => {
    //         state.user = null,
    //         state.loading = false;
    //         state.error = action.payload;
    //     })
    // }
});

// export const {logout} = authSlice.actions;
export const { getAllUsersRequest, getAllUsersSuccess, getAllUsersFailure } = userSlice.actions

export const selectAllUsers = (state) => state.user.allUsers;

export default userSlice.reducer;