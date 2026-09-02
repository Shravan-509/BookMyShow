import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const initialState = {
    loading: false,
    error: null,
    cities: [],
};

const citySlice = createSlice({
    name: "city",
    initialState,
    reducers: {
        fetchCitiesRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchCitiesSuccess: (state, action) => {
            state.loading = false;
            state.cities = action.payload || [];
            state.error = null;
        },
        fetchCitiesFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        createCityRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        createCitySuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        createCityFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateCityRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        updateCitySuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        updateCityFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        deactivateCityRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        deactivateCitySuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        deactivateCityFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchCitiesRequest,
    fetchCitiesSuccess,
    fetchCitiesFailure,
    createCityRequest,
    createCitySuccess,
    createCityFailure,
    updateCityRequest,
    updateCitySuccess,
    updateCityFailure,
    deactivateCityRequest,
    deactivateCitySuccess,
    deactivateCityFailure,
} = citySlice.actions;

const selectCityState = (state) => state.city;

export const selectCities = createSelector([selectCityState], (city) => city.cities || []);
export const selectActiveCities = createSelector(
    [selectCities],
    (cities) => cities.filter((city) => city.isActive)
);
export const selectCityLoading = createSelector([selectCityState], (city) => city.loading);
export const selectCityError = createSelector([selectCityState], (city) => city.error);

export default citySlice.reducer;
