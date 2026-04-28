import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
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
    }
});


// export const {logout} = authSlice.actions;
export const { getAllUsersRequest, getAllUsersSuccess, getAllUsersFailure } = userSlice.actions

// Base selector
const selectUserState = (state) => state.user;

// Memoized selectors using reselect
export const selectAllUsers = createSelector([selectUserState], (user) => user.allUsers);
export const selectUserLoading = createSelector([selectUserState], (user) => user.loading);
export const selectUserError = createSelector([selectUserState], (user) => user.error);

// Complex selector - filtered verified users
export const selectVerifiedUsers = createSelector(
  [selectAllUsers],
  (users) => users ? users.filter(u => u.emailVerified) : []
);

// Memoized user count
export const selectUserCount = createSelector(
  [selectAllUsers],
  (users) => users ? users.length : 0
);

// Memoized users by role
export const selectUsersByRole = createSelector(
  [selectAllUsers],
  (users) => {
    if (!users) return { admin: [], partner: [], user: [] };
    return {
      admin: users.filter(u => u.role === 'admin'),
      partner: users.filter(u => u.role === 'partner'),
      user: users.filter(u => u.role === 'user'),
    };
  }
);

export default userSlice.reducer;