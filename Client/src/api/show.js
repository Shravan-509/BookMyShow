import { axiosInstance } from ".";


export const addShow = async (payload) => {
    try {
        const response = await axiosInstance.post('/shows', payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const updateShow = async (id, payload) => {
    try {
        const response = await axiosInstance.patch(`/shows/${id}`, payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const deleteShow = async (id) => {
    try {
        const response = await axiosInstance.delete(`/shows/${id}`);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const getShowsById = async (id) => {
    try {
        const response = await axiosInstance.get(`/shows/${id}`);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const getShowsByTheatre = async (id) => {
    try {
        const response = await axiosInstance.get(`/shows/theatre/${id}`);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const getAllTheatresByMovies = async (payload) => {
    try {
        const response = await axiosInstance.post('/shows/theatres/movie', payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};