import { axiosInstance } from "."

export class ProfileAPI {
  static async fetchProfile() {
      const response = await axiosInstance.get("/users/profile")
      return response.data
  }

  static async updateProfile(profileData) {
      const response = await axiosInstance.put("/users/update-profile", profileData)
      return response.data
  }

  static async changePassword(passwordData) {
      const response = await axiosInstance.put("/users/change-password", passwordData)
      return response.data
  }

  static async requestEmailChange(emailData) {
      const response = await axiosInstance.post("/users/request-email-change", emailData)
      return response.data
  }

  static async verifyEmailChange(verificationData) {
      const response = await axiosInstance.post("/users/verify-email-change", verificationData)
      return response.data
  }

  static async toggle2FA() {
      const response = await axiosInstance.put("/users/toggle-2fa")
      return response.data
  }

  static async deleteAccount(password) {
      const response = await axiosInstance.delete("/users/delete-account", { data: { password } })
      return response.data
  }
}
