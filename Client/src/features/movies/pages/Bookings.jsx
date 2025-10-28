
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  QRCode,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  Collapse,
  Modal,
} from "antd"
import {
  BarcodeOutlined,
  DownOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DownCircleOutlined,
} from "@ant-design/icons"
import moment from "moment"
const { Text, Title } = Typography
const { Panel } = Collapse
import armChairUrl from "../../../assets/arm_chair.svg"
import { useAuth } from "../../../hooks/useAuth"
import NoBookings from "./NoBookings"
import { scheduleBookingReminder } from "../../../utils/reminderUtils"
import { notify } from "../../../utils/notificationUtils"
import { useBooking } from "../../../hooks/useBooking"

// Color mapping for ticket status
const getStatusColor = (status) => {
  const normalized = String(status || "").toLowerCase()
  if (normalized.includes("confirm")) return "green"
  if (normalized.includes("pending")) return "orange"
  if (normalized.includes("cancel")) return "red"
  return "blue"
}

// Memoized Booking Card to prevent unnecessary re-renders per item
const BookingCard = React.memo(function BookingCard({ booking, isMobile, onViewBookingInfo, formatCurrency }) {
  const seatCount = useMemo(() => booking.seats.length, [booking.seats])
  const baseTotal = useMemo(() => booking.ticketPrice * seatCount, [booking.ticketPrice, seatCount])
  const convenienceFee = booking.convenienceFee
  const grandTotal = useMemo(() => Math.round((baseTotal + convenienceFee) * 100) / 100, [baseTotal, convenienceFee])

  return (
    <div className="mb-6">
      <Card 
          className="shadow-sm! rounded-xl! relative! border-0!" 
          styles={{
            body: {
              padding: isMobile ? "16px" : "24px",
            },
          }}
      >
        <div className={`absolute ${isMobile ? "right-4 top-4" : "right-6 top-6"} flex items-center gap-3`}>
          <Tag color={getStatusColor(booking.ticketStatus)} className="text-sm! px-3! py-1! rounded-full">
            {booking.ticketStatus}
          </Tag>
          {!isMobile && (
            <Button
              icon={<BarcodeOutlined />}
              type="default"
              size="small"
              className="border-[#f84464]! text-[#f84464]! hover:border-[#dc3558]! hover:text-[#dc3558]!"
              onClick={() => onViewBookingInfo(booking)}
            >
              View Booking Info
            </Button>
          )}
        </div>

        {/* Desktop layout */}
        {!isMobile && (
          <Flex wrap="wrap" gap={24}>
            <img
              alt="Movie Poster"
              src={booking.poster || "/placeholder.svg"}
              className="rounded-lg!"
              style={{ height: 200, width: 130, objectFit: "cover" }}
            />

            <div className="ticket-divider" />

            <Flex vertical className="flex-1">
              <Space direction="vertical" className="w-full">
                <Title level={4} className="mb-1!">
                  {booking.movieTitle} <span className="text-sm text-gray-500">2D</span>
                </Title>
                <Text strong className="text-lg!">
                  {moment(booking.showDate).format("ddd, DD MMM YYYY")} | {" "}
                  {moment(booking.showTime, "HH:mm").format("hh:mm A")}
                </Text>
                <Text type="secondary">{booking.theatreName}</Text>
                <Text type="secondary">Quantity : {seatCount}</Text>
                <Text strong>
                  <div className="flex items-center gap-2">
                    <img src={armChairUrl || "/placeholder.svg"} alt="Seat Icon" />
                    <span>
                      {booking.seatType?.toUpperCase()} - {booking.seats.join(", ")}
                    </span>
                  </div>
                </Text>

                <Row justify="space-between">
                  <Col>
                    <Text>Ticket Price</Text>
                  </Col>
                  <Col>{formatCurrency(baseTotal)}</Col>
                </Row>

                <Row justify="space-between">
                  <Col>
                    <Text>Convenience Fee</Text>
                    <div className="text-xs text-gray-500">Incl. of Tax</div>
                  </Col>
                  <Col>{formatCurrency(convenienceFee)}</Col>
                </Row>

                <Divider style={{ border: "1px dashed rgb(229, 229, 229)", margin: "8px 0" }} />

                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong>Amount Paid</Text>
                  </Col>
                  <Col>
                    <Text strong className="text-xl!">{formatCurrency(grandTotal)}</Text>
                  </Col>
                </Row>
              </Space>
            </Flex>

            <div className="flex justify-center items-center">
              <QRCode value={booking.bookingId} size={100} />
            </div>
          </Flex>
        )}

        {/* Mobile layout */}
        {isMobile && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <img
                alt="Movie Poster"
                src={booking.poster || "/placeholder.svg?height=160&width=104&query=movie poster"}
                className="rounded-lg!"
                style={{ height: 160, width: 104, objectFit: "cover" }}
              />
            </div>

            <div className="text-center">
              <Title level={5} className="mb-2!">
                {booking.movieTitle} <span className="text-sm text-gray-500">2D</span>
              </Title>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-1 justify-center">
                  <CalendarOutlined className="text-gray-500" />
                  <Text strong>{moment(booking.showDate).format("ddd, DD MMM YYYY")}</Text>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <ClockCircleOutlined className="text-gray-500" />
                  <Text strong>{moment(booking.showTime, "HH:mm").format("hh:mm A")}</Text>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <EnvironmentOutlined className="text-gray-500" />
                  <Text type="secondary">{booking.theatreName}</Text>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <img src={armChairUrl || "/placeholder.svg"} alt="Seat Icon" className="w-4 h-4" />
                <Text strong className="text-sm">
                  {booking.seatType?.toUpperCase()} - {booking.seats.join(", ")}
                </Text>
              </div>
              <Text type="secondary" className="text-sm">
                {seatCount} {seatCount === 1 ? "Ticket" : "Tickets"}
              </Text>
            </div>

            <Button
              icon={<BarcodeOutlined />}
              type="default"
              className="border-[#f84464]! text-[#f84464]! hover:border-[#dc3558]! hover:text-[#dc3558]! w-full"
              onClick={() => onViewBookingInfo(booking)}
            >
              View Booking Info & QR Code
            </Button>

            <Collapse 
              bordered={false}
              ghost 
              expandIconPosition="start" 
              className="custom-collapse bg-transparent!"
              expandIcon={({ isActive }) => <DownCircleOutlined rotate={isActive ? -180 : 0} />}
            >
            
              <Panel
                header={
                  <div className="flex justify-between items-center w-full pr-4">
                    <Text strong>Amount Paid</Text>
                    <Text strong className="text-lg!">{formatCurrency(grandTotal)}</Text>
                  </div>
                }
                key="1"
              >
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Text className="text-sm">Ticket Price</Text>
                    <Text className="text-sm">{formatCurrency(baseTotal)}</Text>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <Text className="text-sm">Convenience Fee</Text>
                      <div className="text-xs text-gray-500">Incl. of Tax</div>
                    </div>
                    <Text className="text-sm">{formatCurrency(convenienceFee)}</Text>
                  </div>
                </div>
              </Panel>
            </Collapse>

            <div className="mt-2 pt-2 border-t border-gray-100 space-y-3">
              <div className="text-center">
                <Text className="text-xs text-gray-500 block">BOOKING DATE & TIME</Text>
                <Text className="text-sm font-medium">
                  {moment(booking.bookingTime).format("MMM DD YYYY")} {" "}
                  {moment(booking.bookingTime).format("hh:mm A")}
                </Text>
              </div>

              <div className="text-center">
                <Text className="text-xs text-gray-500 block">PAYMENT METHOD</Text>
                <Text className="text-sm font-medium">{booking.paymentMethod || "Online Payment"}</Text>
              </div>

              <div className="text-center">
                <Text className="text-xs text-gray-500 block">BOOKING ID</Text>
                <Text className="text-sm font-medium font-mono">{booking.bookingId}</Text>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Footer for desktop retains BMS style */}
        {!isMobile && (
          <div
            style={{
              margin: "16px 0px 36px",
              color: "rgb(102, 102, 102)",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <div style={{ margin: "0px 50px 0px 0px" }}>
              <Text style={{ fontSize: "10px", fontWeight: 400, color: "rgb(102, 102, 102)" }}>BOOKING DATE & TIME</Text>
              <div style={{ fontSize: "12px", fontWeight: 400, color: "rgb(51, 51, 51)" }}>
                {moment(booking.bookingTime).format("MMM DD YYYY")} {" "}
                {moment(booking.bookingTime).format("hh:mm A")}
              </div>
            </div>

            <div style={{ margin: "0px 50px 0px 0px" }}>
              <Text style={{ fontSize: "10px", fontWeight: 400, color: "rgb(102, 102, 102)" }}>PAYMENT METHOD</Text>
              <div style={{ fontSize: "12px", fontWeight: 400, color: "rgb(51, 51, 51)" }}>{booking.paymentMethod || "N/A"}</div>
            </div>

            <div style={{ margin: "0px 50px 0px 0px" }}>
              <Text style={{ fontSize: "10px", fontWeight: 400, color: "rgb(102, 102, 102)" }}>BOOKING ID</Text>
              <div style={{ fontSize: "12px", fontWeight: 400, color: "rgb(51, 51, 51)" }}>{booking.bookingId}</div>
            </div>
          </div>
        )}
    </div>
  )
})

const OrderHistory = () => {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const scheduledBookings = useRef(new Set());

  const { userBookings: bookings, loading, error, getUserBookings } = useBooking()

  const fetchUserBookings = () => {
    if (user?._id) {
      getUserBookings(user._id)
    }
  }

  useEffect(() => {
    fetchUserBookings()
  }, [user?._id])

  useEffect(() => {
    if (bookings.length === 0) return

    // Load already scheduled reminders from localStorage
    const scheduledReminders = JSON.parse(localStorage.getItem("booking_reminders") || "[]")
    const scheduledIds = new Set(scheduledReminders.map(r => r.bookingId))
    console.log(scheduledIds);
    
    bookings.forEach((booking) => {
      if (!scheduledIds.has(booking.bookingId)) 
      {
        const showDateTime = moment(`${booking.showDate} ${booking.showTime}`, "YYYY-MM-DD HH:mm")
        console.log(showDateTime)
        if (showDateTime.isAfter(moment())) 
        {
          scheduleBookingReminder(booking)
        }
      }
    })
    
  }, [bookings])

  useEffect(() => {
    if (error) {
      notify("error", error)
    }
  }, [error])

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const apply = () => setIsMobile(media.matches)
    apply()

    // Safari uses addEventListener on MediaQueryList in modern versions
    if (typeof media.addEventListener === "function") 
    {
      media.addEventListener("change", apply)
      return () => media.removeEventListener("change", apply)
    }

    // Fallback for older browsers
    media.addListener(apply)
    return () => media.removeListener(apply)
  }, [])

  const formatCurrency = useCallback((amount) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, [])

  const handleViewBookingInfo = useCallback((booking) => {
    setSelectedBooking(booking)
    setShowQRModal(true)
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-6 px-4">
        <Card className="rounded-xl!">
          <Skeleton avatar paragraph={{ rows: 6 }} active />
        </Card>
      </div>
    )
  }

  return (
    <>
      {bookings.length === 0 ? (
        <NoBookings />
      ) : (
        <div className="max-w-4xl mx-auto px-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.bookingId || `${booking.movieTitle}-${booking.showDate}-${booking.showTime}`}
              booking={booking}
              isMobile={isMobile}
              onViewBookingInfo={handleViewBookingInfo}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      <Modal
        title="Booking Details"
        open={showQRModal}
        onCancel={() => setShowQRModal(false)}
        footer={null}
        centered
        width={isMobile ? "90%" : 400}
      >
        {selectedBooking && (
          <div className="text-center space-y-4">
            <div>
              <Title level={5} className="mb-2!">
                {selectedBooking.movieTitle}
              </Title>
              <Text type="secondary" className="block">
                {selectedBooking.theatreName}
              </Text>
              <Text type="secondary" className="block">
                {moment(selectedBooking.showDate).format("ddd, DD MMM YYYY")} | {" "}
                {moment(selectedBooking.showTime, "HH:mm").format("hh:mm A")}
              </Text>
            </div>

            <div className="flex justify-center">
              <QRCode value={selectedBooking.bookingId} size={200} />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <Text className="text-xs text-gray-500 block">BOOKING ID</Text>
              <Text className="text-sm font-medium font-mono">{selectedBooking.bookingId}</Text>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <Text className="text-xs text-gray-500 block">SEATS</Text>
              <Text className="text-sm font-medium">{selectedBooking.seatType?.toUpperCase()} - {selectedBooking.seats?.join(", ")}</Text>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <Text className="text-xs text-gray-500 block">AMOUNT PAID</Text>
              <Text className="text-sm font-medium">{`₹${Number((selectedBooking.ticketPrice * (selectedBooking.seats?.length || 0)) + (selectedBooking.convenienceFee || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</Text>
            </div>

            <Text type="secondary" className="text-xs block">
              Show this QR code at the cinema for entry
            </Text>
          </div>
        )}
      </Modal>
    </>
  )
}

export default OrderHistory


