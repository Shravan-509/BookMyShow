import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  inventory: null,
  loading: false,
  error: null,
};

const showSeatSlice = createSlice({
  name: "showSeat",
  initialState,
  reducers: {
    fetchShowSeatsRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.inventory = null;
    },
    fetchShowSeatsSuccess: (state, action) => {
      state.loading = false;
      state.error = null;
      state.inventory = action.payload;
    },
    fetchShowSeatsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.inventory = null;
    },
    clearShowSeats: (state) => {
      state.inventory = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
  fetchShowSeatsFailure,
  clearShowSeats,
} = showSeatSlice.actions;

const selectShowSeatState = (state) => state.showSeat;

export const selectShowSeatInventory = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.inventory,
);

export const selectShowSeatLoading = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.loading,
);

export const selectShowSeatError = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.error,
);

export default showSeatSlice.reducer;
