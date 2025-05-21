import React, { useState, useEffect } from "react"
import { Layout, Menu, Typography, Button, Card, Tabs, Form, Input, message, Spin, Avatar, Divider, Modal } from "antd"
import {
  UserOutlined,
  HomeOutlined,
  SettingOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  LogoutOutlined,
  EditOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"
import Personalnformation from "./Personal_Information"
import PasswordChange from "./PasswordChange"
import EmailChange from "./EmailChange"
import Security from "./Security"

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { TabPane } = Tabs

const Profile = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState(null)
 
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [tempEmail, setTempEmail] = useState("")

  const tabItems = [
    {
      key: "1",
      label: "Personal Information",
      children:  <Personalnformation
                    userData={userData}
                    saving={saving}
                  />
    },
    {
      key: "2",
      label: "Change Password",
      children: <PasswordChange 
                  userData={userData}
                  saving={saving}
                />
    },
    {
      key: "3",
      label: "Change Email",
      children: <EmailChange 
                  userData={userData}
                  saving={saving}
                />
    },
    {
      key: "4",
      label: "Security",
      children: <Security userData={userData}/>
    }
  ]

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Title level={3} style={{ margin: 0 }}>
            My Profile
      </Title>
      
      <Content style={{ margin: "24px 16px", padding: 24, minHeight: 280 }}>
        <div className="profile-header" style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <Avatar 
            size={80} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: "#e5293e" }} 
            src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" 
          />
          <div style={{ marginLeft: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              {userData?.name || "Shravan Kumar Atti"}
            </Title>
            <Text type="secondary">{userData?.email || "shravan.atti@gmail.com"}</Text>
          </div>
        </div>

        <Divider />

        <Tabs 
          defaultActiveKey="1" 
          tabPosition={"left"} 
          items={tabItems}
          style={{ margin: "10px" }}
        >
        </Tabs>
      </Content>

    {/* Email Verification Modal */}
      <Modal
        title="Verify Email Change"
        open={showEmailVerification}
        onCancel={() => setShowEmailVerification(false)}
        footer={[
          <Button key="cancel" 
            // onClick={() => setShowEmailVerification(false)}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saving}
            // onClick={handleVerifyEmailChange}
            style={{ backgroundColor: "#e5293e", borderColor: "#e5293e" }}
          >
            Verify
          </Button>,
        ]}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: "#e5293e", marginBottom: 16 }} />
          <p>
            We've sent a verification code to <strong>{tempEmail}</strong>. Please enter the code below to verify your
            new email address.
          </p>
          <Input.OTP
            inputType="numeric"
            length={6}
            value={verificationCode}
            onChange={setVerificationCode}
            autoFocus
            style={{ margin: "20px 0" }}
          />
        </div>
      </Modal>
  </Layout>
  )
}

export default Profile