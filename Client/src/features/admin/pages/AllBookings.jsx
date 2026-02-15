"use client"

import { useEffect, useState } from "react"
import { Table, Tag, Input, DatePicker, Space, Card, Statistic, Row, Col, message } from "antd"
import { SearchOutlined, DollarOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons"

import { getAllBookingsRequest, selectAllBookings, selectBookingLoading } from "../../../redux/slices/bookingSlice"
import moment from "moment";
import { useDispatch, useSelector } from "react-redux"

const { RangePicker } = DatePicker

const AllBookings = () => {
  const dispatch = useDispatch()
  const bookings = useSelector(selectAllBookings)
  const loading = useSelector(selectBookingLoading)
  const [filteredBookings, setFilteredBookings] = useState([])
  const [searchText, setSearchText] = useState("")
  const [dateRange, setDateRange] = useState(null)

  useEffect(() => {
    dispatch(getAllBookingsRequest())
  }, [dispatch])

  useEffect(() => {
    let filtered = [...bookings]

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (booking) =>
          booking.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.movieTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.theatreName?.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.bookingId?.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) 
    {
     
      filtered = filtered.filter((booking) => {
        const bookingDate = moment(booking.bookingTime);
        const startDate = moment(dateRange[0].toDate())  // convert dayjs → Date → moment
        const endDate = moment(dateRange[1].toDate())
  
        return bookingDate.isSameOrAfter(startDate, "day") && bookingDate.isSameOrBefore(endDate, "day")
      })
    }

    setFilteredBookings(filtered)
  }, [searchText, dateRange, bookings])

  const columns = [
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 150,
      fixed: "left",
    },
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "userEmail",
      key: "userEmail",
      width: 200,
    },
    {
      title: "Phone",
      dataIndex: "userPhone",
      key: "userPhone",
      width: 130,
    },
    {
      title: "Movie",
      dataIndex: "movieTitle",
      key: "movieTitle",
      width: 180,
    },
    {
      title: "Theatre",
      dataIndex: "theatreName",
      key: "theatreName",
      width: 180,
    },
    {
      title: "Show Date",
      dataIndex: "showDate",
      key: "showDate",
      width: 120,
      render: (date) => moment(date).format("DD MMM YYYY"),
    },
    {
      title: "Show Time",
      dataIndex: "showTime",
      key: "showTime",
      width: 100,
    },
    {
      title: "Seats",
      dataIndex: "seats",
      key: "seats",
      width: 150,
      render: (seats) => seats?.join(", "),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (amount) => `₹${amount?.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "ticketStatus",
      key: "ticketStatus",
      width: 120,
      render: (status) => {
        let color = "green"
        if (status === "Cancelled") color = "red"
        if (status === "Pending") color = "orange"
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: "Booking Time",
      dataIndex: "bookingTime",
      key: "bookingTime",
      width: 160,
      render: (time) => moment(time).format("DD MMM YYYY HH:mm"),
    },
  ]

  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
  const totalTickets = filteredBookings.reduce((sum, booking) => sum + (booking.seats?.length || 0), 0)
  const uniqueUsers = new Set(filteredBookings.map((b) => b.userEmail)).size

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={filteredBookings.length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Unique Users"
              value={uniqueUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Input
            placeholder="Search by name, email, movie, theatre, or booking ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400, maxWidth: "100%" }}
          />
          <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} format="DD MMM YYYY" />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredBookings}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} bookings`,
          }}
        />
      </Card>
    </div>
  )
}

export default AllBookings
