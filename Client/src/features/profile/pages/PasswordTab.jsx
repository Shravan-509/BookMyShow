import React, { useEffect } from "react"
import {Alert, Button, Card, Form, Input, Typography } from "antd"
import { LockOutlined } from "@ant-design/icons"
import { useProfile } from "../../../hooks/useProfile";

const {Title, Text, Paragraph} = Typography;

const PasswordChangeTab = () => {
    const [passwordForm] = Form.useForm();
    const { passwordChangeLoading, passwordChangeError, changePassword, clearErrors } = useProfile();

    const handleSubmit = (values) => {
        changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
        })
    }

    const handleFormChange = () => {
        // Clear errors when user starts typing
        if (passwordChangeError) 
        {
            clearErrors()
        }
    }

    // Reset form when password change is successful
    useEffect(() => {
        if(!passwordChangeLoading && !passwordChangeError)
        {
            // Only reset if we were previously loading (indicating a successful operation)
            const wasLoading = passwordForm.getFieldsValue().currentPassword
            if (wasLoading) 
            {
                passwordForm.resetFields();
            }
        }
    }, [passwordChangeLoading, passwordChangeError, passwordForm])


  return (
    <Card 
        title={
            <Title level={4} className="mb-0! text-[#f84464]!">
                Change Password
            </Title>
        }
        className="rounded-xl!"
        styles={{
            body: {
                padding: '24px'
            }
        }}
    >
         <Paragraph className="text-gray-500 mb-6 text-sm">
            Choose a strong password to keep your account secure. Your password should be at least 8 characters long.
        </Paragraph>

        {
            passwordChangeError && (
                <Alert
                    message="Password Change Failed"
                    description={passwordChangeError}
                    type="error"
                    showIcon
                    closable
                    onClose={clearErrors}
                    className="mb-4!"
                />
        )}

        <Form 
            form={passwordForm} 
            layout="vertical" 
            onFinish={handleSubmit}
            onValuesChange={handleFormChange}
            disabled={passwordChangeLoading}
        >
            <Form.Item
                name="currentPassword"
                label={<Text strong>Current Password</Text>}
                rules={[
                    { required: true, message: "Please enter your current password" }
                ]}
            >
                <Input.Password 
                    prefix={<LockOutlined style={{ marginRight: 8 }}/>} 
                    placeholder="Enter your Current Password" 
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="newPassword"
                label={<Text strong>New Password</Text>}
                rules={[
                    { required: true, message: "Please enter your new password" },
                    { min: 8, message: "Password must be at least 8 characters" },
                    {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    }
                ]}
            >
                <Input.Password 
                    prefix={<LockOutlined style={{ marginRight: 8 }}/>} 
                    placeholder="Enter your New Password" size="large"
                />
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                label={<Text strong>Confirm New Password</Text>}
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
                <Input.Password 
                    prefix={<LockOutlined style={{ marginRight: 8 }}/>} 
                    placeholder="Confirm New Password" 
                    size="large"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LockOutlined />}
                    loading={passwordChangeLoading}
                    size="large"
                    className='bg-[#f84464]! hover:bg-[#dc3558]! text-white! mt-2'
                >
                    Change Password
                </Button>
            </Form.Item>
        </Form>
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f6f8fa", borderRadius: 6 }}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>Password Requirements:</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#666" }}>
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter</li>
            <li>Contains at least one lowercase letter</li>
            <li>Contains at least one number</li>
            </ul>
        </div>
    </Card>
  )
}

export default PasswordChangeTab