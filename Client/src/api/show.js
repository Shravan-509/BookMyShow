import { axiosInstance } from "."

export class ShowAPI {
  static async create(payload) {
      const response = await axiosInstance.post("/shows", payload)
      return response?.data
  }

  static async update(id, payload) {
      const response = await axiosInstance.patch(`/shows/${id}`, payload)
      return response?.data
  }

  static async delete(id) {
      const response = await axiosInstance.delete(`/shows/${id}`)
      return response?.data
  }

  static async fetchById(id) {
      const response = await axiosInstance.get(`/shows/${id}`)
      return response?.data
  }

  static async fetchByTheatre(id) {
      const response = await axiosInstance.get(`/shows/theatre/${id}`)
      return response?.data
  }

  static async fetchTheatresByMovie(payload) {
      const response = await axiosInstance.post("/shows/theatres/movie", payload)
      return response?.data
  }
}
