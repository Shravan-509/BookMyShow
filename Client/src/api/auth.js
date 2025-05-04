import { axiosInstance } from ".";

export const RegisterUser = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/register", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const VerifyEmail = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/verify-email", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const ResendVerification = async (valu) => {
    try {
        const response = await axiosInstance.post("/auth/resend-verification", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const LoginUser = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/login", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};


export const Verify2FA = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/verify-2fa", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};


export const Resend2FA = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/resend-2fa", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};

export const ReverifyEmail = async (payload) => {
    try {
        const response = await axiosInstance.post("/auth/request-reverification", payload);
        return response.data;
    } catch (error) {
        return error;
    }
};
