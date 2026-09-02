import { takeLatest, put, call } from "redux-saga/effects";
import {
    createCityFailure,
    createCityRequest,
    createCitySuccess,
    deactivateCityFailure,
    deactivateCityRequest,
    deactivateCitySuccess,
    fetchCitiesFailure,
    fetchCitiesRequest,
    fetchCitiesSuccess,
    updateCityFailure,
    updateCityRequest,
    updateCitySuccess,
} from "../slices/citySlice";
import { CityAPI } from "../../api/city";
import { notify } from "../../utils/notificationUtils";

function* fetchCitiesSaga(action) {
    try {
        const response = yield call(CityAPI.fetch, action.payload?.includeInactive);
        if(response.success) {
            yield put(fetchCitiesSuccess(response.data));
        } else {
            yield put(fetchCitiesFailure(response.message));
            notify("warning", "Failed to fetch cities", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(fetchCitiesFailure(errorMessage));
        notify("error", "Error fetching cities. Please try again.", errorMessage);
    }
}

function* createCitySaga(action) {
    try {
        const response = yield call(CityAPI.create, action.payload);
        if(response.success) {
            yield put(createCitySuccess());
            notify("success", response.message);
            yield put(fetchCitiesRequest({ includeInactive: true }));
        } else {
            yield put(createCityFailure(response.message));
            notify("warning", "Failed to add city", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(createCityFailure(errorMessage));
        notify("error", "Error adding city. Please try again.", errorMessage);
    }
}

function* updateCitySaga(action) {
    try {
        const response = yield call(CityAPI.update, action.payload.id, action.payload.city);
        if(response.success) {
            yield put(updateCitySuccess());
            notify("success", response.message);
            yield put(fetchCitiesRequest({ includeInactive: true }));
        } else {
            yield put(updateCityFailure(response.message));
            notify("warning", "Failed to update city", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(updateCityFailure(errorMessage));
        notify("error", "Error updating city. Please try again.", errorMessage);
    }
}

function* deactivateCitySaga(action) {
    try {
        const response = yield call(CityAPI.deactivate, action.payload);
        if(response.success) {
            yield put(deactivateCitySuccess());
            notify("success", response.message);
            yield put(fetchCitiesRequest({ includeInactive: true }));
        } else {
            yield put(deactivateCityFailure(response.message));
            notify("warning", "Failed to deactivate city", response.message);
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message;
        yield put(deactivateCityFailure(errorMessage));
        notify("error", "Error deactivating city. Please try again.", errorMessage);
    }
}

export function* citySaga() {
    yield takeLatest(fetchCitiesRequest.type, fetchCitiesSaga);
    yield takeLatest(createCityRequest.type, createCitySaga);
    yield takeLatest(updateCityRequest.type, updateCitySaga);
    yield takeLatest(deactivateCityRequest.type, deactivateCitySaga);
}
