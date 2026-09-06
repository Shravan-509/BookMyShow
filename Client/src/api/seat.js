import { axiosInstance } from ".";

export class SeatAPI {
  static async fetchByScreen(screenId) {
    const response = await axiosInstance.get(`/screens/${screenId}/seats`);
    return response?.data;
  }

  static async create(payload) {
    const response = await axiosInstance.post("/seats", payload);
    return response?.data;
  }

  static async update(id, payload) {
    const response = await axiosInstance.patch(`/seats/${id}`, payload);
    return response?.data;
  }

  static async disable(id) {
    const response = await axiosInstance.delete(`/seats/${id}`);
    return response?.data;
  }

  static async bulkCreate(screenId, rows) {
    const response = await axiosInstance.post(`/screens/${screenId}/seats/bulk`, { rows });
    return response?.data;
  }
}
