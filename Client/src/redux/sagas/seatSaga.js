import { call, put, takeLatest } from "redux-saga/effects";
import { SeatAPI } from "../../api/seat";
import { notify } from "../../utils/notificationUtils";
import {
  bulkCreateSeatsFailure,
  bulkCreateSeatsRequest,
  bulkCreateSeatsSuccess,
  createSeatFailure,
  createSeatRequest,
  createSeatSuccess,
  disableSeatFailure,
  disableSeatRequest,
  disableSeatSuccess,
  fetchSeatsByScreenFailure,
  fetchSeatsByScreenRequest,
  fetchSeatsByScreenSuccess,
  updateSeatFailure,
  updateSeatRequest,
  updateSeatSuccess,
} from "../slices/seatSlice";

function* fetchSeatsByScreenSaga(action) {
  try {
    const response = yield call(SeatAPI.fetchByScreen, action.payload.screenId);
    if (response.success) {
      yield put(fetchSeatsByScreenSuccess({
        screenId: action.payload.screenId,
        seats: response.data,
        summary: response.summary,
      }));
    } else {
      yield put(fetchSeatsByScreenFailure(response.message));
      notify("warning", "Failed to fetch seats", response.message);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(fetchSeatsByScreenFailure(errorMessage));
    notify("error", "Error fetching seats. Please try again.", errorMessage);
  }
}

function* createSeatSaga(action) {
  try {
    const response = yield call(SeatAPI.create, action.payload.seat);
    if (response.success) {
      yield put(createSeatSuccess());
      notify("success", response.message);
      yield put(fetchSeatsByScreenRequest({ screenId: action.payload.screenId }));
    } else {
      yield put(createSeatFailure(response.message));
      notify("warning", "Failed to add seat", response.message);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(createSeatFailure(errorMessage));
    notify("error", "Error adding seat. Please try again.", errorMessage);
  }
}

function* updateSeatSaga(action) {
  try {
    const response = yield call(SeatAPI.update, action.payload.id, action.payload.seat);
    if (response.success) {
      yield put(updateSeatSuccess());
      notify("success", response.message);
      yield put(fetchSeatsByScreenRequest({ screenId: action.payload.screenId }));
    } else {
      yield put(updateSeatFailure(response.message));
      notify("warning", "Failed to update seat", response.message);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(updateSeatFailure(errorMessage));
    notify("error", "Error updating seat. Please try again.", errorMessage);
  }
}

function* disableSeatSaga(action) {
  try {
    const response = yield call(SeatAPI.disable, action.payload.id);
    if (response.success) {
      yield put(disableSeatSuccess());
      notify("success", response.message);
      yield put(fetchSeatsByScreenRequest({ screenId: action.payload.screenId }));
    } else {
      yield put(disableSeatFailure(response.message));
      notify("warning", "Failed to disable seat", response.message);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(disableSeatFailure(errorMessage));
    notify("error", "Error disabling seat. Please try again.", errorMessage);
  }
}

function* bulkCreateSeatsSaga(action) {
  try {
    const response = yield call(SeatAPI.bulkCreate, action.payload.screenId, action.payload.rows);
    if (response.success) {
      yield put(bulkCreateSeatsSuccess());
      notify("success", response.message);
      yield put(fetchSeatsByScreenRequest({ screenId: action.payload.screenId }));
    } else {
      yield put(bulkCreateSeatsFailure(response.message));
      notify("warning", "Failed to add seats", response.message);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(bulkCreateSeatsFailure(errorMessage));
    notify("error", "Error adding seats. Please try again.", errorMessage);
  }
}

export function* seatSaga() {
  yield takeLatest(fetchSeatsByScreenRequest.type, fetchSeatsByScreenSaga);
  yield takeLatest(createSeatRequest.type, createSeatSaga);
  yield takeLatest(updateSeatRequest.type, updateSeatSaga);
  yield takeLatest(disableSeatRequest.type, disableSeatSaga);
  yield takeLatest(bulkCreateSeatsRequest.type, bulkCreateSeatsSaga);
}
