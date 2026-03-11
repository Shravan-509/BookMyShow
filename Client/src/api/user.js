import { axiosInstance } from "."

export class UserAPI {
  static async fetchProfile() {
    try {
      const response = await axiosInstance.get("/users")
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async logout() {
    try {
      const response = await axiosInstance.post("/users/logout")
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async fetchAllUsers() {
    try {
      const response = await axiosInstance.get("/users/admin/all")
      return response.data
    } catch (error) {
      throw error
    }
  }
}
