import { axiosInstance } from ".";


export const addTheatre = async (payload) => {
    try {
        const response = await axiosInstance.post('/theatres', payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const updateTheatre = async (id, payload) => {
    try {
        const response = await axiosInstance.patch(`/theatres/${id}`, payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const deleteTheatre = async (id) => {
    try {
        const response = await axiosInstance.delete(`/theatres/${id}`);
        return response?.data;
    } catch (error) {
        return error;
    }
};

// getTheatresByOwner & getTheatresForAdmin merged to one dynamic to get Theatres info
export const getTheatres = async () => {
    try {
        const response = await axiosInstance.get("/theatres");
        return response?.data;
    } catch (error) {
        return error;
    }
};
