"use client"

import { useEffect, useState } from "react"
import { Table, Tag, Input, Card, Statistic, Row, Col, message, Badge, Space } from "antd"
import { SearchOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons"
import { getAllUsersRequest } from "../../../redux/slices/userSlice"
import moment from "moment"
import { useDispatch, useSelector } from "react-redux"

const UserManagement = () => {
  const dispatch = useDispatch()
  const { allUsers: users, loading } = useSelector((state) => state.user)
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchText, setSearchText] = useState("")

  useEffect(() => {
    dispatch(getAllUsersRequest())
  }, [dispatch])


  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.phone?.toString().includes(searchText) ||
          user.role?.toLowerCase().includes(searchText.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } 
    else 
    {
      setFilteredUsers(users)
    }
  }, [searchText, users])

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      fixed: "left",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role) => {
        let color = "blue"
        if (role === "admin") color = "red"
        if (role === "partner") color = "orange"
        if (role === "user") color = "green"
        return <Tag color={color}>{role?.toUpperCase()}</Tag>
      },
    },
    {
      title: "Email Verified",
      dataIndex: "emailVerified",
      key: "emailVerified",
      width: 140,
      render: (verified) =>
        verified ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Verified
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Not Verified
          </Tag>
        ),
    },
    {
      title: "2FA Enabled",
      dataIndex: "twoFactorEnabled",
      key: "twoFactorEnabled",
      width: 130,
      render: (enabled) =>
        enabled ? <Badge status="success" text="Enabled" /> : <Badge status="default" text="Disabled" />,
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => moment(date).format("DD MMM YYYY"),
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      render: (date) => moment(date).format("DD MMM YYYY HH:mm"),
    },
  ]

  const totalUsers = filteredUsers.length
  const verifiedUsers = filteredUsers.filter((u) => u.emailVerified).length
  const adminCount = filteredUsers.filter((u) => u.role === "admin").length
  const partnerCount = filteredUsers.filter((u) => u.role === "partner").length
  const userCount = filteredUsers.filter((u) => u.role === "user").length

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Verified Users"
              value={verifiedUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Partners"
              value={partnerCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Regular Users"
              value={userCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Search by name, email, phone, or role"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400, maxWidth: "100%" }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </Card>
    </div>
  )
}

export default UserManagement
