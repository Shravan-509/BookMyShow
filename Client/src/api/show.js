import { axiosInstance } from "."

export class ShowAPI {
  static async create(payload) {
    try {
      const response = await axiosInstance.post("/shows", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async update(id, payload) {
    try {
      const response = await axiosInstance.patch(`/shows/${id}`, payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async delete(id) {
    try {
      const response = await axiosInstance.delete(`/shows/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchById(id) {
    try {
      const response = await axiosInstance.get(`/shows/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchByTheatre(id) {
    try {
      const response = await axiosInstance.get(`/shows/theatre/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchTheatresByMovie(payload) {
    try {
      const response = await axiosInstance.post("/shows/theatres/movie", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }
}
