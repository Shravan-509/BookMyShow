import React from 'react'
import { Button, Form, Input, Modal, Typography } from 'antd'
import { SafetyCertificateOutlined } from "@ant-design/icons";

import { useProfile } from '../../../hooks/useProfile';

const {Title, Text, Paragraph} = Typography;
const EmailChangeModal = () => {
    const [form] = Form.useForm();
    const {
        showEmailVerificationModal,
        pendingEmailChange,
        emailChangeLoading,
        emailChangeError,
        verifyEmailChange,
        setEmailVerificationModal,
        clearErrors,
    } = useProfile();

     const handleVerify = (values) => {
        verifyEmailChange({
            code: values.code,
            newEmail: pendingEmailChange,
        })
    }

    const handleClose = () => {
        setEmailVerificationModal(false);
        form.resetFields();
        clearErrors();
    }

  return (
      <Modal
        open={showEmailVerificationModal}
        onCancel={handleClose}
        footer={null}
        centered
        destroyOnClose
        title={
            <Title level={4} className="!mb-0">
                Verify Email Change
            </Title>
        }
      >
        <div className="text-center py-4">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md animate-pulse ring-2 ring-yellow-300">
                <SafetyCertificateOutlined className="!text-5xl !text-yellow-600"/>
            </div>

           <Title level={5} style={{ marginBottom: 8 }}>
                Verify Your New Email
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
                We've sent a verification code to:
            </Paragraph>
            <Text strong style={{ fontSize: "16px" }}>
                {pendingEmailChange}
            </Text>
            <Paragraph style={{ marginTop: 16, color: "#666" }}>
                Enter the 6-digit code below to complete the email update.
            </Paragraph>

            {emailChangeError && (
                <div
                    style={{
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor: "#fff2f0",
                    border: "1px solid #ffccc7",
                    borderRadius: 6,
                    color: "#ff4d4f",
                    }}
                >
                    {emailChangeError}
                </div>
            )}

            <Form
                form={form}
                onFinish={handleVerify}
                style={{ marginTop: 24, maxWidth: 300, marginInline: "auto" }}
            >
                <Form.Item
                    name="code"
                    rules={[
                    { required: true, message: "Please enter the verification code" },
                    { len: 6, message: "Verification code must be 6 digits" },
                    ]}
                >
                    <Input.OTP
                        inputType="numeric"
                        length={6}
                        autoFocus
                        size="large"
                        style={{ justifyContent: "center" }}
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <div className="flex justify-center gap-3">
                        <Button onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={emailChangeLoading}
                            className="!bg-[#f84464] hover:!bg-[#dc3558] border-none"
                        >
                            Verify Email
                        </Button>
                    </div>
                </Form.Item>
            </Form>

            <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    Didn't receive the code? Check your spam folder or try again later.
                </Text>
            </div>
          
        </div>
      </Modal>
  )
}

export default EmailChangeModal