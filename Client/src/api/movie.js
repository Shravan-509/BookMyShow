import { axiosInstance } from "."

export class MovieAPI {
  static async fetch() {
    const response = await axiosInstance.get("/movies")
    return response?.data
  }

  static async create(payload) {
    const response = await axiosInstance.post("/movies", payload)
    return response?.data
  }

  static async update(id, payload) {
    const response = await axiosInstance.patch(`/movies/${id}`, payload)
    return response?.data
  }

  static async delete(id) {
    const response = await axiosInstance.delete(`/movies/${id}`)
    return response?.data
  }

  static async fetchById(id) {
    const response = await axiosInstance.get(`/movies/${id}`)
    return response?.data
  }
}
