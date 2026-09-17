import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  inventory: null,
  loading: false,
  error: null,
  lock: null,
  lockLoading: false,
  lockError: null,
  refreshLoading: false,
  refreshError: null,
  releaseLoading: false,
  releaseError: null,
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
    acquireSeatLockRequest: (state) => {
      state.lockLoading = true;
      state.lockError = null;
    },
    acquireSeatLockSuccess: (state, action) => {
      state.lockLoading = false;
      state.lockError = null;
      state.lock = action.payload;
    },
    acquireSeatLockFailure: (state, action) => {
      state.lockLoading = false;
      state.lockError = action.payload;
    },
    refreshSeatLockRequest: (state) => {
      state.refreshLoading = true;
      state.refreshError = null;
    },
    refreshSeatLockSuccess: (state, action) => {
      state.refreshLoading = false;
      state.refreshError = null;

      if (
        state.lock
        && state.lock.showId === action.payload.showId
        && state.lock.lockToken === action.payload.lockToken
      ) {
        state.lock.lockExpiresAt = action.payload.lockExpiresAt;
      }
    },
    refreshSeatLockFailure: (state, action) => {
      state.refreshLoading = false;
      state.refreshError = action.payload;
    },
    releaseSeatLockRequest: (state) => {
      state.releaseLoading = true;
      state.releaseError = null;
    },
    releaseSeatLockSuccess: (state, action) => {
      state.releaseLoading = false;
      state.releaseError = null;

      if (
        state.lock
        && state.lock.showId === action.payload.showId
        && state.lock.lockToken === action.payload.lockToken
      ) {
        state.lock = null;
      }
    },
    releaseSeatLockFailure: (state, action) => {
      state.releaseLoading = false;
      state.releaseError = action.payload;
    },
    clearFrontendSeatLockState: (state) => {
      state.lock = null;
      state.lockLoading = false;
      state.lockError = null;
      state.refreshLoading = false;
      state.refreshError = null;
      state.releaseLoading = false;
      state.releaseError = null;
    },
  },
});

export const {
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
  fetchShowSeatsFailure,
  clearShowSeats,
  acquireSeatLockRequest,
  acquireSeatLockSuccess,
  acquireSeatLockFailure,
  refreshSeatLockRequest,
  refreshSeatLockSuccess,
  refreshSeatLockFailure,
  releaseSeatLockRequest,
  releaseSeatLockSuccess,
  releaseSeatLockFailure,
  clearFrontendSeatLockState,
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

export const selectShowSeatLock = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.lock,
);

export const selectShowSeatLockToken = createSelector(
  [selectShowSeatLock],
  (lock) => lock?.lockToken ?? null,
);

export const selectShowSeatLockExpiresAt = createSelector(
  [selectShowSeatLock],
  (lock) => lock?.lockExpiresAt ?? null,
);

export const selectShowSeatLockedSeats = createSelector(
  [selectShowSeatLock],
  (lock) => lock?.seats ?? [],
);

export const selectShowSeatLockLoading = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.lockLoading,
);

export const selectShowSeatLockError = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.lockError,
);

export const selectShowSeatRefreshLoading = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.refreshLoading,
);

export const selectShowSeatRefreshError = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.refreshError,
);

export const selectShowSeatReleaseLoading = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.releaseLoading,
);

export const selectShowSeatReleaseError = createSelector(
  [selectShowSeatState],
  (showSeat) => showSeat.releaseError,
);

export default showSeatSlice.reducer;
