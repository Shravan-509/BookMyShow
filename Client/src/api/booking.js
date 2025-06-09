import { axiosInstance } from ".";


export const bookSeat = async (payload) => {
    try {
        const response = await axiosInstance.post('/bookings/bookSeat', payload);
        return response?.data;
    } catch (error) {
        return error;
    }
};

export const createPaymentIntent = async (payload) => {
    try {
        const response = await axiosInstance.post('/bookings/create-payment-intent', payload);
        return response?.data;
    } catch (error) {
         return error;
    }
}

export const createRazorPayOrder = async (payload) => {
    try {
        const response = await axiosInstance.post('/bookings/createOrder', payload);
        return response?.data;
    } catch (error) {
         return error;
    }
}

export const bookingsByUserId = async (id) => {
    try {
        const response = await axiosInstance.get(`/bookings/${id}`);
        return response?.data;
    } catch (error) {
        return error;
    }
};