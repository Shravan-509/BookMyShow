import { axiosInstance } from ".";

export const UserInfo = async () => {
    try {
        const response = await axiosInstance.get("/users");
        return response.data;
    } catch (error) {
        return error
        
    }
}

export const UserLogout = async () => {
    try {
        const response = await axiosInstance.post("/users/logout");
        return response.data;
    } catch (error) {
        return error
        
    }
}