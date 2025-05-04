import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "/bms/v1",
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