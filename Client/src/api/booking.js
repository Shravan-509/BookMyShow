import { axiosInstance } from "."

export class BookingAPI {
  static async validateSeats(payload) {
    try {
      const response = await axiosInstance.post("/bookings/validateSeats", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async bookSeats(payload) {
    try {
      const response = await axiosInstance.post("/bookings/bookSeat", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async createPaymentIntent(payload) {
    try {
      const response = await axiosInstance.post("/bookings/create-payment-intent", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async createRazorPayOrder(payload) {
    try {
      const response = await axiosInstance.post("/bookings/createOrder", payload)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchByUserId(id) {
    try {
      const response = await axiosInstance.get(`/bookings/${id}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchAllBookings() {
    try {
      const response = await axiosInstance.get("/bookings/admin/all")
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchByTheatre(theatreId) {
    try {
      const response = await axiosInstance.get(`/bookings/theatre/${theatreId}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }

  static async fetchRevenueByOwner(ownerId) {
    try {
      const response = await axiosInstance.get(`/bookings/revenue/${ownerId}`)
      return response?.data
    } catch (error) {
      throw error
    }
  }
}
