import { axiosInstance } from "."

export class AuthAPI {
  static async register(payload) {
    try {
      const response = await axiosInstance.post("/auth/register", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async verifyEmail(payload) {
    try {
      const response = await axiosInstance.post("/auth/verify-email", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async resendVerification(payload) {
    try {
      const response = await axiosInstance.post("/auth/resend-verification", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async login(payload) {
    try {
      const response = await axiosInstance.post("/auth/login", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async verify2FA(payload) {
    try {
      const response = await axiosInstance.post("/auth/verify-2fa", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async resend2FA(payload) {
    try {
      const response = await axiosInstance.post("/auth/resend-2fa", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async reverifyEmail(payload) {
    try {
      const response = await axiosInstance.post("/auth/request-reverification", payload)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async checkAuth() {
    try {
      const response = await axiosInstance.get("/users/profile")
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async logout() {
    try {
      const response = await axiosInstance.post("/auth/logout")
      return response.data
    } catch (error) {
      throw error
    }
  }
}