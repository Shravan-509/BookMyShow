import { axiosInstance } from "."

export class ForgotPasswordAPI {
  static async forgotPassword(email) {
    try {
      const response = await axiosInstance.post("/auth/forgot-password", { email })
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async resetPassword(resetData) {
    try {
      const response = await axiosInstance.post("/auth/reset-password", resetData)
      return response.data
    } catch (error) {
      throw error
    }
  }
}
