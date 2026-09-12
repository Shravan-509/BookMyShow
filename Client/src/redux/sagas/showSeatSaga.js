import { call, put, takeLatest } from "redux-saga/effects";
import { ShowSeatAPI } from "../../api/showSeat";
import { notify } from "../../utils/notificationUtils";
import {
  fetchShowSeatsFailure,
  fetchShowSeatsRequest,
  fetchShowSeatsSuccess,
} from "../slices/showSeatSlice";

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

export function* showSeatSaga() {
  yield takeLatest(fetchShowSeatsRequest.type, fetchShowSeatsSaga);
}
