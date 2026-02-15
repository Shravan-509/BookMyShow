import { axiosInstance } from "."

export class VerificationAPI {
  static async verifyEmail(payload) {
    try {
      const response = await axiosInstance.post("/auth/verify-email", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async verifyTwoFactor(payload) {
    try {
      const response = await axiosInstance.post("/auth/verify-2fa", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async reverifyAccount(payload) {
    try {
      const response = await axiosInstance.post("/auth/request-reverification", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async resendCode(type, payload) {
    try {
      const endpoint = type === "email" ? "/auth/resend-verification" : "/auth/resend-2fa"
      const response = await axiosInstance.post(endpoint, payload)
      return response.data
    } catch (error) {
      throw error
    }
  }
}
