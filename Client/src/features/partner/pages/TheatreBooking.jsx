"use client"

import { useEffect, useState } from "react"
import { Table, Tag, Select, Card, Statistic, Row, Col, message, Empty } from "antd"
import { ShoppingOutlined, DollarOutlined, TeamOutlined } from "@ant-design/icons"
import { useDispatch, useSelector } from "react-redux"
import { selectTheatre } from "../../../redux/slices/theatreSlice"
import {
  getTheatreBookingsRequest,
  selectTheatreBookings,
  selectBookingLoading,
} from "../../../redux/slices/bookingSlice"

import moment from "moment"
import RupeeIcon from "../../../assets/RupeeIcon"

const { Option } = Select

const TheatreBookings = () => {
  const dispatch = useDispatch()
  const theatres = useSelector(selectTheatre)
  const bookings = useSelector(selectTheatreBookings)
  const loading = useSelector(selectBookingLoading)
  const [selectedTheatreId, setSelectedTheatreId] = useState(null)

  useEffect(() => {
    if (theatres && theatres.length > 0 && !selectedTheatreId) {
      setSelectedTheatreId(theatres[0]._id)
    }
  }, [theatres, selectedTheatreId])

  useEffect(() => {
    if (selectedTheatreId) 
    {
      dispatch(getTheatreBookingsRequest(selectedTheatreId))
    }
  }, [selectedTheatreId, dispatch])

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

  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
  const totalTickets = bookings.reduce((sum, booking) => sum + (booking.seats?.length || 0), 0)
  const uniqueUsers = new Set(bookings.map((b) => b.userEmail)).size

  const selectedTheatre = theatres?.find((t) => t._id === selectedTheatreId)

  return (
    <div style={{ padding: "20px" }}>
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ marginRight: "12px", fontWeight: "500" }}>Select Theatre:</label>
          <Select
            value={selectedTheatreId}
            onChange={setSelectedTheatreId}
            style={{ width: 300, maxWidth: "100%" }}
            placeholder="Select a theatre"
          >
            {theatres?.map((theatre) => (
              <Option key={theatre._id} value={theatre._id}>
                {theatre.name}
              </Option>
            ))}
          </Select>
        </div>

        {selectedTheatre && (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Address:</strong> {selectedTheatre.address}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Tag color={selectedTheatre.isActive ? "green" : "red"}>
                {selectedTheatre.isActive ? "Active" : "Inactive"}
              </Tag>
            </p>
          </div>
        )}
      </Card>

      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={bookings.length}
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
              prefix={<RupeeIcon style={{ fontSize: '22px' }} />}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Unique Customers"
              value={uniqueUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {bookings.length === 0 && !loading ? (
          <Empty description="No bookings found for this theatre" />
        ) : (
          <Table
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 1600 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} bookings`,
            }}
          />
        )}
      </Card>
    </div>
  )
}

export default TheatreBookings
