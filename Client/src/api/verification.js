import { axiosInstance } from "."

export class VerificationAPI {
  static async verifyEmail(payload) {
      const response = await axiosInstance.post("/auth/verify-email", payload)
      return response.data
  }

  static async verifyTwoFactor(payload) {
      const response = await axiosInstance.post("/auth/verify-2fa", payload)
      return response.data
  }

  static async reverifyAccount(payload) {
      const response = await axiosInstance.post("/auth/request-reverification", payload)
      return response.data
  }

  static async resendCode(type, payload) {
      const endpoint = type === "email" ? "/auth/resend-verification" : "/auth/resend-2fa"
      const response = await axiosInstance.post(endpoint, payload)
      return response.data
  }
}
