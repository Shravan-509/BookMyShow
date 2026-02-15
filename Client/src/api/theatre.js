import { axiosInstance } from "."

export class TheatreAPI {
  static async create(payload) {
    try {
      const response = await axiosInstance.post("/theatres", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async update(id, payload) {
    try {
      const response = await axiosInstance.patch(`/theatres/${id}`, payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async delete(id) {
    try {
      const response = await axiosInstance.delete(`/theatres/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  // getTheatresByOwner & getTheatresForAdmin merged to one dynamic to get Theatres info
  static async fetch() {
    try {
      const response = await axiosInstance.get("/theatres")
      return response?.data
    } catch (error) {
      throw error
    }
  }
}
