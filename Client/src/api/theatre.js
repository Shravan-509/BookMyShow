import { axiosInstance } from "."

export class TheatreAPI {
  static async create(payload) {
      const response = await axiosInstance.post("/theatres", payload)
      return response?.data
  }

  static async update(id, payload) {
      const response = await axiosInstance.patch(`/theatres/${id}`, payload)
      return response?.data
  }

  static async delete(id) {
      const response = await axiosInstance.delete(`/theatres/${id}`)
      return response?.data
  }

  // getTheatresByOwner & getTheatresForAdmin merged to one dynamic to get Theatres info
  static async fetch() {
      const response = await axiosInstance.get("/theatres")
      return response?.data
  }
}
