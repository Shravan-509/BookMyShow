import { axiosInstance } from "."

export class UserAPI {
  static async fetchProfile() {
      const response = await axiosInstance.get("/users")
      return response.data
  }

  static async logout() {
      const response = await axiosInstance.post("/users/logout")
      return response.data
  }

  static async fetchAllUsers() {
      const response = await axiosInstance.get("/users/admin/all")
      return response.data
  }
}
