import { axiosInstance } from "."

export class AuthAPI {
  static async register(payload) {
      const response = await axiosInstance.post("/auth/register", payload)
      return response.data
  }

  static async verifyEmail(payload) {
      const response = await axiosInstance.post("/auth/verify-email", payload)
      return response.data
  }

  static async resendVerification(payload) {
      const response = await axiosInstance.post("/auth/resend-verification", payload)
      return response.data
  }

  static async login(payload) {
      const response = await axiosInstance.post("/auth/login", payload)
      return response.data
  }

  static async verify2FA(payload) {
      const response = await axiosInstance.post("/auth/verify-2fa", payload)
      return response.data
  }

  static async resend2FA(payload) {
      const response = await axiosInstance.post("/auth/resend-2fa", payload)
      return response.data
  }

  static async reverifyEmail(payload) {
      const response = await axiosInstance.post("/auth/request-reverification", payload)
      return response.data
  }

  static async checkAuth() {
      const response = await axiosInstance.get("/users/profile")
      return response.data
  }

  static async logout() {
      const response = await axiosInstance.post("/auth/logout")
      return response.data
  }
}