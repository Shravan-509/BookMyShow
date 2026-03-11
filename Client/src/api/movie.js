import { axiosInstance } from "."

export class MovieAPI {
  static async fetch() {
    try {
      const response = await axiosInstance.get("/movies")
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async create(payload) {
    try {
      const response = await axiosInstance.post("/movies", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async update(id, payload) {
    try {
      const response = await axiosInstance.patch(`/movies/${id}`, payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async delete(id) {
    try {
      const response = await axiosInstance.delete(`/movies/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchById(id) {
    try {
      const response = await axiosInstance.get(`/movies/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }
}
