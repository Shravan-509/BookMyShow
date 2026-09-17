import { axiosInstance } from ".";

export class ShowSeatAPI {
  static async fetchByShow(showId) {
    const response = await axiosInstance.get(`/shows/${showId}/seats`);
    return response?.data;
  }

  static async acquireLock(showId, seats) {
    const response = await axiosInstance.post(`/shows/${showId}/seats/lock`, { seats });
    return response?.data;
  }

  static async refreshLock(showId, seats, lockToken) {
    const response = await axiosInstance.post(`/shows/${showId}/seats/refresh`, {
      seats,
      lockToken,
    });
    return response?.data;
  }

  static async releaseLock(showId, seats, lockToken) {
    const response = await axiosInstance.post(`/shows/${showId}/seats/release`, {
      seats,
      lockToken,
    });
    return response?.data;
  }
}
