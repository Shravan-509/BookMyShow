import React,{ useState, useEffect } from "react"
import { Alert, Button, Card, Form, Input, Typography } from "antd"
import { LockOutlined, MailOutlined, EditOutlined } from "@ant-design/icons"
import { useProfile } from "../../../hooks/useProfile";

const {Title, Text, Paragraph} = Typography;

const EmailTab = () => {
    const [emailForm] = Form.useForm();
    const { 
            profile, 
            emailChangeLoading, 
            emailChangeError, 
            requestEmailChange, 
            clearErrors, 
            showEmailVerificationModal 
        } = useProfile();

    
    // Reset form when email change request is successful
    useEffect(() => {
        if(showEmailVerificationModal)
        {
            emailForm.resetFields()
        }
    }, [showEmailVerificationModal, emailForm]);

    const handleSubmit = (values) => {
        requestEmailChange({
            newEmail: values.newEmail,
            password: values.password
        })
    };

    const handleFormChange = (values) => {
        // Clear errors when user starts typing
        if (emailChangeError) {
            clearErrors()
        }
    };

  return (
    <Card
        title={
        <Title level={4} className="!mb-0 !text-[#f84464]">
          Email Settings
        </Title>
      }
      className="!rounded-xl"
      styles={{
          body: {
            padding: '24px'
          }
      }}
    >
        <Paragraph className="text-gray-500 mb-6 text-sm">
            Change your email address. You'll need to verify the new email before it becomes active.
        </Paragraph>

        {/* Current Email */}
        <div className="mb-6 p-4 rounded-md bg-[#f6f8fa] border border-[#d9d9d9]">
            <Text strong className="!text-gray-700 !mr-2">Current Email: </Text>
            <Text code className="!text-base">{profile?.email}</Text>
        </div>

        {
            emailChangeError && (
                <Alert
                    message="Email Change Failed"
                    description={emailChangeError}
                    type="error"
                    showIcon
                    closable
                    onClose={clearErrors}
                    className="!mb-4"
                />
        )}

        <Form 
            form={emailForm} 
            layout="vertical" 
            onFinish={handleSubmit}
            onValuesChange={handleFormChange}
            disabled={emailChangeLoading}
        >
            <Form.Item
                name="newEmail"
                label="New Email Address"
                rules={[
                    { required: true, message: "Please enter your new email address" },
                    { type: "email", message: "Please enter a valid email" },
                    {
                        validator: (_, value) => 
                            value && value === profile?.email
                            ? Promise.reject("New email must be different from current email")
                            : Promise.resolve() 
                    },
                ]}
            >
                <Input 
                    prefix={<MailOutlined />} 
                    placeholder="Enter your new email address" 
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="password"
                label="Current Password"
                rules={[
                    { 
                        required: true, 
                        message: "Please confirm with your current password" 
                    }
                ]}
            >
                <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Enter your current password" 
                    size="large"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<EditOutlined />}
                    loading={emailChangeLoading}
                    size="large"
                    className='!bg-[#f84464] hover:!bg-[#dc3558] !text-white'
                >
                    Request Email Change
                </Button>
            </Form.Item>
        </Form>

        {/* Important Note */}
        <div className="mt-6 p-4 rounded-md border border-[#ffd591] bg-[#fff7e6]">
            <Title level={5} style={{ color: "#d46b08", marginBottom: 8 }}>
                Important:
            </Title>
            <ul className="list-disc pl-5 text-sm text-[#d46b08]">
            <li>A verification code will be sent to your new email address</li>
            <li>You must verify the new email before changes apply</li>
            <li>You can still log in using your current email until verification</li>
            </ul>
        </div>
    </Card>
  )
}

export default EmailTab