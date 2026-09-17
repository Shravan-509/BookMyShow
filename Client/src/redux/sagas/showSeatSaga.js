import { call, put, takeLatest } from "redux-saga/effects";
import { ShowSeatAPI } from "../../api/showSeat";
import { notify } from "../../utils/notificationUtils";
import {
  acquireSeatLockFailure,
  acquireSeatLockRequest,
  acquireSeatLockSuccess,
  fetchShowSeatsFailure,
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
  refreshSeatLockFailure,
  refreshSeatLockRequest,
  refreshSeatLockSuccess,
  releaseSeatLockFailure,
  releaseSeatLockRequest,
  releaseSeatLockSuccess,
} from "../slices/showSeatSlice";

export const normalizeShowSeatLockError = (error, fallbackMessage = "Seat lock request failed") => {
  const responseData = error?.response?.data || error || {};

  return {
    message: responseData.message || error?.message || fallbackMessage,
    code: responseData.code || null,
    status: error?.response?.status || responseData.statusCode || null,
  };
};

const toShowSeatLockState = (data = {}) => ({
  showId: data.showId,
  seats: data.seats,
  lockToken: data.lockToken,
  lockExpiresAt: data.lockExpiresAt,
});

export function* fetchShowSeatsSaga(action) {
  try {
    const showId = action.payload?.showId || action.payload;
    const response = yield call(ShowSeatAPI.fetchByShow, showId);

    if (response.success) {
      yield put(fetchShowSeatsSuccess(response.data));
    } else {
      yield put(fetchShowSeatsFailure(response.message));
      notify("warning", "Failed to fetch seat inventory", response.message);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(fetchShowSeatsFailure(errorMessage));
    notify("error", "Error fetching seat inventory. Please try again.", errorMessage);
  }
}

export function* acquireSeatLockSaga(action) {
  try {
    const { showId, seats } = action.payload;
    const response = yield call(ShowSeatAPI.acquireLock, showId, seats);

    if (response.success) {
      yield put(acquireSeatLockSuccess(toShowSeatLockState(response.data)));
    } else {
      yield put(acquireSeatLockFailure(normalizeShowSeatLockError(response)));
    }
  } catch (error) {
    yield put(acquireSeatLockFailure(normalizeShowSeatLockError(error)));
  }
}

export function* refreshSeatLockSaga(action) {
  try {
    const { showId, seats, lockToken } = action.payload;
    const response = yield call(ShowSeatAPI.refreshLock, showId, seats, lockToken);

    if (response.success) {
      yield put(refreshSeatLockSuccess(toShowSeatLockState(response.data)));
    } else {
      yield put(refreshSeatLockFailure(normalizeShowSeatLockError(response)));
    }
  } catch (error) {
    yield put(refreshSeatLockFailure(normalizeShowSeatLockError(error)));
  }
}

export function* releaseSeatLockSaga(action) {
  try {
    const { showId, seats, lockToken } = action.payload;
    const response = yield call(ShowSeatAPI.releaseLock, showId, seats, lockToken);

    if (response.success) {
      yield put(releaseSeatLockSuccess({
        ...response.data,
        showId,
        lockToken,
      }));
    } else {
      yield put(releaseSeatLockFailure(normalizeShowSeatLockError(response)));
    }
  } catch (error) {
    yield put(releaseSeatLockFailure(normalizeShowSeatLockError(error)));
  }
}

export function* showSeatSaga() {
  yield takeLatest(fetchShowSeatsRequest.type, fetchShowSeatsSaga);
  yield takeLatest(acquireSeatLockRequest.type, acquireSeatLockSaga);
  yield takeLatest(refreshSeatLockRequest.type, refreshSeatLockSaga);
  yield takeLatest(releaseSeatLockRequest.type, releaseSeatLockSaga);
}
