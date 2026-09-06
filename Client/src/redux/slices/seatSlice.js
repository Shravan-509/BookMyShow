import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  error: null,
  seatsByScreen: {},
  summariesByScreen: {},
};

const seatSlice = createSlice({
  name: "seat",
  initialState,
  reducers: {
    fetchSeatsByScreenRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSeatsByScreenSuccess: (state, action) => {
      state.loading = false;
      state.error = null;
      state.seatsByScreen[action.payload.screenId] = action.payload.seats || [];
      state.summariesByScreen[action.payload.screenId] = action.payload.summary || null;
    },
    fetchSeatsByScreenFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    createSeatRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createSeatSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    createSeatFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateSeatRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateSeatSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    updateSeatFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    disableSeatRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    disableSeatSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    disableSeatFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    bulkCreateSeatsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    bulkCreateSeatsSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    bulkCreateSeatsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchSeatsByScreenRequest,
  fetchSeatsByScreenSuccess,
  fetchSeatsByScreenFailure,
  createSeatRequest,
  createSeatSuccess,
  createSeatFailure,
  updateSeatRequest,
  updateSeatSuccess,
  updateSeatFailure,
  disableSeatRequest,
  disableSeatSuccess,
  disableSeatFailure,
  bulkCreateSeatsRequest,
  bulkCreateSeatsSuccess,
  bulkCreateSeatsFailure,
} = seatSlice.actions;

const selectSeatState = (state) => state.seat;

export const selectSeatLoading = createSelector([selectSeatState], (seat) => seat.loading);
export const selectSeatError = createSelector([selectSeatState], (seat) => seat.error);
export const selectSeatsByScreen = (screenId) => createSelector(
  [selectSeatState],
  (seat) => seat.seatsByScreen[screenId] || [],
);
export const selectSeatSummaryByScreen = (screenId) => createSelector(
  [selectSeatState],
  (seat) => seat.summariesByScreen[screenId] || null,
);

export default seatSlice.reducer;
