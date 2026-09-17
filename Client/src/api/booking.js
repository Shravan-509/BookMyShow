import { axiosInstance } from "."

const withoutEmptyLockToken = (payload = {}) => {
  const { lockToken, ...bookingPayload } = payload;
  return typeof lockToken === "string" && lockToken.trim()
    ? { ...bookingPayload, lockToken }
    : bookingPayload;
};

export class BookingAPI {
  static async validateSeats(payload) {
      const response = await axiosInstance.post("/bookings/validateSeats", payload)
      return response?.data
    }

  static async bookSeats(payload) {
      const response = await axiosInstance.post("/bookings/bookSeat", withoutEmptyLockToken(payload))
      return response?.data
    }

  static async createPaymentIntent(payload) {
      const response = await axiosInstance.post("/bookings/create-payment-intent", payload)
      return response?.data
    }

  static async createRazorPayOrder(payload) {
      const response = await axiosInstance.post("/bookings/createOrder", withoutEmptyLockToken(payload))
      return response?.data
    }

  static async fetchByUserId(id) {
      const response = await axiosInstance.get(`/bookings/${id}`)
      return response?.data
    }

  static async fetchAllBookings() {
      const response = await axiosInstance.get("/bookings/admin/all")
      return response?.data
    }

  static async fetchByTheatre(theatreId) {
      const response = await axiosInstance.get(`/bookings/theatre/${theatreId}`)
      return response?.data
    }

  static async fetchRevenueByOwner(ownerId) {
      const response = await axiosInstance.get(`/bookings/revenue/${ownerId}`)
      return response?.data
    }
}
