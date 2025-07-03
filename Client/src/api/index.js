import axios from "axios";
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
    baseURL: VITE_API_URL,
    headers: {
        "Content-Type" : "application/json"
    },
    withCredentials: true 
});

// axiosInstance.interceptors.request.use(
//     (config) => {
//         const access_token = localStorage.getItem("access_token");
//         if(access_token){
//             config.headers.Authorization = `Bearer ${access_token}`;
//         }
//         return config;
//     }, 
//     (error) => {
//         return Promise.reject(error);
//     }
// )