import React, { useState, useEffect } from "react"
import {Button, Card, Form, Input } from "antd"
import { LockOutlined } from "@ant-design/icons"

const PasswordChange = ({userData, saving}) => {
    const [passwordForm] = Form.useForm()
  return (
    <Card title="Update Password" variant="borderless">
        <Form 
            form={passwordForm} 
            layout="vertical" 
        // onFinish={handleChangePassword}
        >
            <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: "Please enter your current password" }]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Current Password" size="large"/>
            </Form.Item>

            <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                { required: true, message: "Please enter your new password" },
                { min: 8, message: "Password must be at least 8 characters" },
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="New Password" size="large"/>
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={["newPassword"]}
                rules={[
                    { required: true, message: "Please confirm your new password" },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                            return Promise.resolve()
                        }
                        return Promise.reject(new Error("The two passwords do not match"))
                        },
                    }),
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" size="large"/>
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LockOutlined />}
                    loading={saving}
                    style={{ backgroundColor: "#e5293e", borderColor: "#e5293e" }}
                >
                    Update Password
                </Button>
            </Form.Item>
        </Form>
    </Card>
  )
}

export default PasswordChange