"use client"

import { useEffect, useState } from "react"
import { Card, Statistic, Row, Col, message, Spin, Empty } from "antd"
import { DollarOutlined, ShoppingOutlined, TeamOutlined, RiseOutlined } from "@ant-design/icons"
import { useDispatch, useSelector } from "react-redux"
import { selectAuth } from "../../../redux/slices/authSlice"
import { getRevenueDataRequest, selectRevenueData, selectBookingLoading } from "../../../redux/slices/bookingSlice"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import RupeeIcon from "../../../assets/RupeeIcon"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

const RevenueTracking = () => {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const revenueData = useSelector(selectRevenueData)
  const loading = useSelector(selectBookingLoading)

  useEffect(() => {
    if (user?._id) {
      dispatch(getRevenueDataRequest(user._id))
    }
  }, [user, dispatch])

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!revenueData) {
    return (
      <div style={{ padding: "20px" }}>
        <Empty description="No revenue data available" />
      </div>
    )
  }

  const { summary, revenueByTheatre, revenueByMonth } = revenueData

  // Format month data for charts
  const monthlyData = revenueByMonth.map((item) => ({
    month: item.month,
    revenue: item.revenue,
  }))

  // Format theatre data for charts
  const theatreData = revenueByTheatre.map((item) => ({
    name: item.theatreName,
    revenue: item.revenue,
    bookings: item.bookings,
    tickets: item.tickets,
  }))

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={summary.totalRevenue}
              prefix={<RupeeIcon style={{ fontSize: '22px' }}/>}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={summary.totalBookings}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Tickets Sold"
              value={summary.totalTickets}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Booking Value"
              value={summary.averageBookingValue}
              prefix={<RiseOutlined />}
              precision={2}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={12}>
          <Card title="Revenue by Month (Last 6 Months)" style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Revenue by Theatre" style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={theatreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Bookings by Theatre" style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={theatreData}
                  dataKey="bookings"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.bookings}`}
                >
                  {theatreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Theatre Performance Comparison" style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={theatreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
                <Bar dataKey="tickets" fill="#8884d8" name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default RevenueTracking
