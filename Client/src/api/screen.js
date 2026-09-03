import { axiosInstance } from "."

export class ScreenAPI {
  static async fetchByTheatre(theatreId, activeOnly = false) {
      const response = await axiosInstance.get(`/theatres/${theatreId}/screens`, {
        params: activeOnly ? { activeOnly: true } : undefined,
      })
      return response?.data
  }

  static async create(payload) {
      const response = await axiosInstance.post("/screens", payload)
      return response?.data
  }

  static async update(id, payload) {
      const response = await axiosInstance.patch(`/screens/${id}`, payload)
      return response?.data
  }

  static async delete(id) {
      const response = await axiosInstance.delete(`/screens/${id}`)
      return response?.data
  }
}
