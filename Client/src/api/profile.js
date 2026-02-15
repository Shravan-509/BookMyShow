import { axiosInstance } from "."

export class ProfileAPI {
  static async fetchProfile() {
    try {
      const response = await axiosInstance.get("/users/profile")
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async updateProfile(profileData) {
    try {
      const response = await axiosInstance.put("/users/update-profile", profileData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async changePassword(passwordData) {
    try {
      const response = await axiosInstance.put("/users/change-password", passwordData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async requestEmailChange(emailData) {
    try {
      const response = await axiosInstance.post("/users/request-email-change", emailData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async verifyEmailChange(verificationData) {
    try {
      const response = await axiosInstance.post("/users/verify-email-change", verificationData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async toggle2FA() {
    try {
      const response = await axiosInstance.put("/users/toggle-2fa")
      return response.data
    } catch (error) {
      throw error
    }
  }

  static async deleteAccount(password) {
    try {
      const response = await axiosInstance.delete("/users/delete-account", { data: { password } })
      return response.data
    } catch (error) {
      throw error
    }
  }
}
