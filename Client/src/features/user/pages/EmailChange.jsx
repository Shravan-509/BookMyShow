import React,{ useState, useEffect } from "react"
import { Button, Card, Form, Input } from "antd"
import { LockOutlined, MailOutlined, EditOutlined } from "@ant-design/icons"

const EmailChange = ({userData, saving}) => {
    const [emailForm] = Form.useForm()
  return (
    <Card title="Update Email Address" variant="borderless">
        <Form form={emailForm} layout="vertical" 
        // onFinish={handleChangeEmail}
        >
        <Form.Item
            name="email"
            label="New Email Address"
            rules={[
                { required: true, message: "Please enter your new email" },
                { type: "email", message: "Please enter a valid email" },
            ]}
        >
            <Input prefix={<MailOutlined />} placeholder="New Email Address" size="large"/>
        </Form.Item>

        <Form.Item
            name="password"
            label="Current Password"
            rules={[{ required: true, message: "Please enter your current password for verification" }]}
        >
            <Input.Password prefix={<LockOutlined />} placeholder="Current Password" size="large"/>
        </Form.Item>

        <Form.Item>
            <Button
                type="primary"
                htmlType="submit"
                icon={<EditOutlined />}
                loading={saving}
                style={{ backgroundColor: "#e5293e", borderColor: "#e5293e" }}
            >
                Request Email Change
            </Button>
        </Form.Item>
        </Form>
    </Card>
  )
}

export default EmailChange