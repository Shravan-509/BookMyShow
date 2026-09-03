import { takeLatest, put, call } from "redux-saga/effects";
import {
    createScreenFailure,
    createScreenRequest,
    createScreenSuccess,
    deleteScreenFailure,
    deleteScreenRequest,
    deleteScreenSuccess,
    fetchScreensByTheatreFailure,
    fetchScreensByTheatreRequest,
    fetchScreensByTheatreSuccess,
    updateScreenFailure,
    updateScreenRequest,
    updateScreenSuccess,
} from "../slices/screenSlice";
import { ScreenAPI } from "../../api/screen";
import { notify } from "../../utils/notificationUtils";

function* fetchScreensByTheatreSaga(action) {
    try {
        const response = yield call(
            ScreenAPI.fetchByTheatre,
            action.payload.theatreId,
            action.payload.activeOnly
        );
        if(response.success) {
            yield put(fetchScreensByTheatreSuccess({
                theatreId: action.payload.theatreId,
                screens: response.data,
            }));
        } else {
            yield put(fetchScreensByTheatreFailure(response.message));
            notify("warning", "Failed to fetch screens", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(fetchScreensByTheatreFailure(errorMessage));
        notify("error", "Error fetching screens. Please try again.", errorMessage);
    }
}

function* createScreenSaga(action) {
    try {
        const response = yield call(ScreenAPI.create, action.payload.screen);
        if(response.success) {
            yield put(createScreenSuccess());
            notify("success", response.message);
            yield put(fetchScreensByTheatreRequest({ theatreId: action.payload.theatreId }));
        } else {
            yield put(createScreenFailure(response.message));
            notify("warning", "Failed to add screen", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(createScreenFailure(errorMessage));
        notify("error", "Error adding screen. Please try again.", errorMessage);
    }
}

function* updateScreenSaga(action) {
    try {
        const response = yield call(ScreenAPI.update, action.payload.id, action.payload.screen);
        if(response.success) {
            yield put(updateScreenSuccess());
            notify("success", response.message);
            yield put(fetchScreensByTheatreRequest({ theatreId: action.payload.theatreId }));
        } else {
            yield put(updateScreenFailure(response.message));
            notify("warning", "Failed to update screen", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(updateScreenFailure(errorMessage));
        notify("error", "Error updating screen. Please try again.", errorMessage);
    }
}

function* deleteScreenSaga(action) {
    try {
        const response = yield call(ScreenAPI.delete, action.payload.id);
        if(response.success) {
            yield put(deleteScreenSuccess());
            notify("success", response.message);
            yield put(fetchScreensByTheatreRequest({ theatreId: action.payload.theatreId }));
        } else {
            yield put(deleteScreenFailure(response.message));
            notify("warning", "Failed to delete screen", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(deleteScreenFailure(errorMessage));
        notify("error", "Error deleting screen. Please try again.", errorMessage);
    }
}

export function* screenSaga() {
    yield takeLatest(fetchScreensByTheatreRequest.type, fetchScreensByTheatreSaga);
    yield takeLatest(createScreenRequest.type, createScreenSaga);
    yield takeLatest(updateScreenRequest.type, updateScreenSaga);
    yield takeLatest(deleteScreenRequest.type, deleteScreenSaga);
}
