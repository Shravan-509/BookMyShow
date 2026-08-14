import { axiosInstance } from "."

export class ForgotPasswordAPI {
  static async forgotPassword(email) {
      const response = await axiosInstance.post("/auth/forgot-password", { email })
      return response.data
    }

  static async resetPassword(resetData) {
      const response = await axiosInstance.post("/auth/reset-password", resetData)
      return response.data
    }
}
