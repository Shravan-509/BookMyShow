"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import moment from "moment"

import { Link, useParams } from "react-router-dom"
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CreditCardOutlined,
} from "@ant-design/icons"
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Space,
  Steps,
  Tag,
  Typography,
  Badge,
} from "antd"
import { useDispatch, useSelector } from "react-redux"
import { SeatLayout } from "../../../components/SeatLayout"
import { useAuth } from "../../../hooks/useAuth"
import PaymentSummary from "./Checkout"
import {
  getShowByIdRequest,
  selectSelectedShow,
  selectShowError,
  selectShowLoading,
} from "../../../redux/slices/showSlice"
import { notify } from "../../../utils/notificationUtils"
import SeatRecommendation from "../../../components/SeatRecommendation"
const { Title, Text } = Typography
const { Step } = Steps

const LoadingSkeleton = React.memo(() => (
  <div className="min-h-screen p-4 md:p-6 lg:p-12 bg-gray-50 flex justify-center">
    <Card className="w-full max-w-4xl">
      <div className="text-center py-12">
        <Skeleton active paragraph={{ rows: 4 }} />
        <Row gutter={[24, 24]} className="mt-8">
          {Array.from({ length: 12 }, (_, i) => (
            <Col xs={24} md={12} key={i}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Col>
          ))}
        </Row>
      </div>
    </Card>
  </div>
))

LoadingSkeleton.displayName = "LoadingSkeleton"

const ScreenDisplay = React.memo(() => (
  <div className="flex flex-col items-center mt-6">
    <svg
      width="300"
      height="50"
      viewBox="0 0 300 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ minHeight: "50px" }} // Prevent layout shift
    >
      <polygon points="10,40 30,10 270,10 290,40" fill="#D6E9FF" stroke="#B0D4FF" strokeWidth="1" />
      <polygon points="10,40 290,40 285,45 15,45" fill="#EAF4FF" stroke="#B0D4FF" strokeWidth="1" />
    </svg>
    <div className="text-xs text-gray-700 mt-2">All eyes this way please!</div>
  </div>
))

ScreenDisplay.displayName = "ScreenDisplay"

const Booking = () => {
  const { user } = useAuth()
  const params = useParams()
  const dispatch = useDispatch()
  const [contactForm] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [ticketCount, setTicketCount] = useState(2)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showBookingSummary, setShowBookingSummary] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [seatPreferences, setSeatPreferences] = useState({
    preferCenter: true,
    preferBack: false,
    preferAisle: false,
  })

  const loading = useSelector(selectShowLoading)
  const showError = useSelector(selectShowError)
  const show = useSelector(selectSelectedShow)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    dispatch(getShowByIdRequest(params.id))
  }, [dispatch, params.id])

  const handleTicketCount = useCallback((value) => {
    if (value) {
      setTicketCount(value)
      setSelectedSeats([])
    }
  }, [])

  const handlePreviousStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1)
  }, [])

  const handleNextStep = useCallback(() => {
    if (currentStep === 0 && selectedSeats.length !== ticketCount) {
      notify("warning", `Please select exactly ${ticketCount} seats`)
      return
    }

    if (currentStep === 1) {
      contactForm
        .validateFields()
        .then(() => {
          setCurrentStep((prev) => prev + 1)
        })
        .catch((info) => {
          notify("warning", `Validate failed : ${info}`)
        })
      return
    }

    setCurrentStep((prev) => prev + 1)
  }, [currentStep, selectedSeats.length, ticketCount, contactForm])

  const handleSeatSelection = useCallback(
    (seatId) => {
      if (selectedSeats.includes(seatId)) {
        setSelectedSeats((prev) => prev.filter((id) => id !== seatId))
      } else if (selectedSeats.length < ticketCount) {
        setSelectedSeats((prev) => [...prev, seatId])
      } else {
        notify("warning", `You can only select ${ticketCount} seats`)
      }
    },
    [selectedSeats, ticketCount],
  )

  const handleRecommendedSeatSelection = useCallback(
    (recommendedSeats) => {
      // Clear current seat selection first
      setSelectedSeats([])
      // Add each seat individually to match the existing selection logic
      recommendedSeats.forEach((seat) => {
        setSelectedSeats((prev) => {
          if (!prev.includes(seat.seatId) && prev.length < ticketCount) {
            return [...prev, seat.seatId]
          }
          return prev
        })
      })
    },
    [ticketCount],
  )

  const formInitialValues = useMemo(
    () => ({
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
    }),
    [user?.name, user?.email, user?.phone],
  )

  const BookingSummaryContent = () => (
    <div className="p-4">
      <div className="mb-4">
        <Text strong className="text-lg">
          {show?.movie.movieName}
        </Text>
        <div className="text-sm text-gray-600 mt-1">{show?.theatre.name}</div>
        <div className="text-sm text-gray-600">
          {moment(show?.date).format("ddd, DD MMM, YYYY")} | {moment(show?.time, "HH:mm").format("hh:mm A")}
        </div>
      </div>

      <Divider />

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Text>Tickets: {ticketCount}</Text>
          <Text strong>₹{show?.ticketPrice * ticketCount || 0}</Text>
        </div>
        <div className="text-sm text-gray-600">
          Selected: {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-gray-200 rounded-sm mr-2" />
          <Text className="text-xs">Available</Text>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-[#1ea83c] rounded-sm mr-2" />
          <Text className="text-xs">Selected</Text>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-500 rounded-sm mr-2" />
          <Text className="text-xs">Booked</Text>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!show) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-12 bg-gray-50 flex flex-col items-center justify-center">
        <Title level={3}>Booking details not found</Title>
        <Link to="/">
          <Button type="primary" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  if (showError) {
    notify("error", "Sorry, something went wrong", showError)
  }

  return (
    show && (
      <main className="min-h-screen p-4 md:p-6 lg:p-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Link to={`/movie/${show?.movie._id}/${moment().format("YYYYMMDD")}`}>
            <ArrowLeftOutlined className="h-4 w-4 mr-2" />
            Back to Theatre
          </Link>

          <div className="mb-6 mt-5">
            <Card style={{ minHeight: isMobile ? "auto" : "600px" }}>
              <div className="flex flex-col justify-between items-start mb-6">
                <Title level={3} className="!mb-1 !text-xl md:!text-2xl">
                  {show?.movie.movieName}
                </Title>

                <Space direction="vertical" size={4} className="!mb-2">
                  <Space size="middle" wrap>
                    <Text className="text-sm md:text-base">{show?.theatre.name}</Text>
                    <Tag color="blue" className="!flex !gap-1 !text-xs md:!text-sm">
                      <CalendarOutlined />
                      {moment(show?.date).format("ddd, DD MMM, YYYY")}
                      <ClockCircleOutlined />
                      {moment(show?.time, "HH:mm").format("hh:mm A")}
                    </Tag>
                  </Space>
                </Space>
              </div>

              <Steps current={currentStep} className="!mb-6" size={isMobile ? "small" : "default"}>
                <Step title={isMobile ? "Seats" : "Select Seats"} />
                <Step title={isMobile ? "Details" : "Your Details"} />
                <Step title="Payment" />
              </Steps>

              {currentStep === 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <Title level={4} className="!mb-0 !text-lg md:!text-xl">
                      Select Number of Tickets
                    </Title>
                    <InputNumber
                      className="w-24"
                      min={1}
                      max={5}
                      value={ticketCount}
                      onChange={handleTicketCount}
                      size={isMobile ? "large" : "middle"}
                    />
                  </div>

                  {isMobile && (
                    <div className="flex gap-2 mb-4">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => setShowBookingSummary(false)}
                        type={!showBookingSummary ? "primary" : "default"}
                        className="flex-1"
                      >
                        Seat View
                      </Button>
                      <Button
                        icon={<CreditCardOutlined />}
                        onClick={() => setShowBookingSummary(true)}
                        type={showBookingSummary ? "primary" : "default"}
                        className="flex-1"
                      >
                        <Badge count={selectedSeats.length} size="small">
                          Summary
                        </Badge>
                      </Button>
                    </div>
                  )}

                  {(!isMobile || !showBookingSummary) && (
                    <>
                      <SeatRecommendation
                        totalSeats={show?.totalSeats}
                        bookedSeats={show?.bookedSeats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleRecommendedSeatSelection}
                        groupSize={ticketCount}
                        preferences={seatPreferences}
                      />

                      <Divider />
                      <div className="mb-6">
                        <div className="seat-selection-area">
                          <SeatLayout
                            totalSeats={show?.totalSeats}
                            bookedSeats={show?.bookedSeats}
                            selectedSeats={selectedSeats}
                            onSeatSelect={handleSeatSelection}
                          />

                          <ScreenDisplay />

                          {!isMobile && (
                            <div className="flex justify-center mt-12" style={{ minHeight: "40px" }}>
                              <div className="flex items-center mr-6">
                                <div className="w-4 h-4 bg-gray-200 rounded-sm mr-2" />
                                <Text>Available</Text>
                              </div>

                              <div className="flex items-center mr-6">
                                <div className="w-4 h-4 bg-[#1ea83c] rounded-sm mr-2" />
                                <Text>Selected</Text>
                              </div>

                              <div className="flex items-center mr-6">
                                <div className="w-4 h-4 bg-gray-500 rounded-sm mr-2" />
                                <Text>Booked</Text>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {isMobile && showBookingSummary && <BookingSummaryContent />}

                  {(!isMobile || !showBookingSummary) && (
                    <>
                      <Divider />
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                          <Text className="block text-sm md:text-base">Selected: </Text>
                          <Text strong className="text-sm md:text-base">
                            {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                          </Text>
                        </div>
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleNextStep}
                          disabled={selectedSeats.length !== ticketCount}
                          className={`!bg-[#f84464] transition-colors duration-200 ${
                            selectedSeats.length !== ticketCount
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:!bg-[#dc3558]"
                          } ${isMobile ? "w-full" : ""}`}
                        >
                          Continue
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <Title level={4} className="!mb-6">
                    Your Contact Details
                  </Title>
                  <Form form={contactForm} layout="vertical" initialValues={formInitialValues}>
                    <Form.Item
                      name={"name"}
                      label="Full Name"
                      rules={[{ required: true, message: "Please enter your name" }]}
                    >
                      <Input placeholder="Enter your full name" />
                    </Form.Item>

                    <Form.Item
                      name={"email"}
                      label="Email Address"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter a valid email" },
                      ]}
                    >
                      <Input placeholder="Enter your email address" />
                    </Form.Item>

                    <Form.Item
                      name={"phone"}
                      label="Phone Number"
                      rules={[
                        { required: true, message: "Please enter your phone number" },
                        { pattern: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit phone number" },
                      ]}
                    >
                      <Input placeholder="Enter your 10-digit phone number" />
                    </Form.Item>

                    <Divider />

                    <div className="flex justify-between">
                      <Button size="large" onClick={handlePreviousStep}>
                        Back
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleNextStep}
                        className="!bg-[#f84464] hover:!bg-[#dc3558]"
                      >
                        Proceed to Pay
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {currentStep === 2 && (
                <PaymentSummary show={show} seats={selectedSeats} handlePreviousStep={handlePreviousStep} />
              )}
            </Card>
          </div>

          {isMobile && currentStep === 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
              <div className="flex justify-between items-center max-w-4xl mx-auto">
                <div className="text-sm">
                  <div className="font-medium">
                    {selectedSeats.length} of {ticketCount} seats selected
                  </div>
                  <div className="text-gray-600">₹{show?.ticketPrice * selectedSeats.length || 0}</div>
                </div>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNextStep}
                  disabled={selectedSeats.length !== ticketCount}
                  className="!bg-[#f84464] hover:!bg-[#dc3558] !min-w-[120px]"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    )
  )
}

export default Booking
