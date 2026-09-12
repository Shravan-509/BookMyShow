import { axiosInstance } from ".";

export class ShowSeatAPI {
  static async fetchByShow(showId) {
    const response = await axiosInstance.get(`/shows/${showId}/seats`);
    return response?.data;
  }
}
