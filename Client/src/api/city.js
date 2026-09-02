import { axiosInstance } from "."

export class CityAPI {
  static async fetch(includeInactive = false) {
      const response = await axiosInstance.get("/cities", {
        params: includeInactive ? { includeInactive: true } : undefined,
      })
      return response?.data
  }

  static async create(payload) {
      const response = await axiosInstance.post("/cities", payload)
      return response?.data
  }

  static async update(id, payload) {
      const response = await axiosInstance.patch(`/cities/${id}`, payload)
      return response?.data
  }

  static async deactivate(id) {
      const response = await axiosInstance.delete(`/cities/${id}`)
      return response?.data
  }
}
