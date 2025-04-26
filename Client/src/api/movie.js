import { axiosInstance } from ".";

export const getMovies = async () => {
    try {
        const response = await axiosInstance.get("/movies");
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const updateMovie = async (id, payload) => {
    try {
        const response = await axiosInstance.patch(`/movies/${id}`, payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const deleteMovie = async (id) => {
    try {
        const response = await axiosInstance.delete(`/movies/${id}`);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const addMovie = async (payload) => {
    try {
        const response = await axiosInstance.post('/movies', payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};