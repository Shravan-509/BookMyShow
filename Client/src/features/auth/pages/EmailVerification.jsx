import React from 'react'
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Modal, Form, Input, Typography } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectShowEmailVerificationModal, 
  selectVerificationEmail, 
  selectVerificationLoading, 
  setShowEmailVerificationModal, 
  resendCodeRequest,
  selectCountdown, 
  selectResendDisabled, 
  verifyEmailRequest
} from "../../../redux/slices/verificationSlice";

const {Text} = Typography;

const EmailVerification = () => {
      const [verifyEmailForm] = Form.useForm();
      const dispatch = useDispatch();
      const isOpen = useSelector(selectShowEmailVerificationModal);
      const verificationEmail = useSelector(selectVerificationEmail);
      const loading = useSelector(selectVerificationLoading);
      const resendDisabled = useSelector(selectResendDisabled);
      const countdown = useSelector(selectCountdown);

      const handleVerifyEmail = (values) => {
       dispatch(verifyEmailRequest({ code: values.code }))
      }

      const handleClose = () => {
        dispatch(setShowEmailVerificationModal(false));
      }

      const handleResendVerificationCode = () => {
        dispatch(resendCodeRequest({ type: "email" }))
      }

  return (
    <Modal
      title="Email Verification"
      open={isOpen}
      footer={null}
      closable={false}
      centered
      className="verification-modal"
    >
      <div className="verification-content">
        {/* <div className="verification-icon">
          <MailOutlined />
        </div> */}
         <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md animate-pulse ring-2 ring-blue-300">
          <MailOutlined className="text-5xl! text-blue-600!" />
        </div>
        <h3>Verify Your Email</h3>
        <p>
          We've sent a 6-digit verification code to <strong>{verificationEmail}</strong>
        </p>
        <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 20 }}>
          Please check your inbox and enter the code below
        </Text>

        <Form form={verifyEmailForm} onFinish={handleVerifyEmail} layout="vertical">
          <Form.Item name="code" rules={[{ required: true, message: "Please enter the verification code" }]}>
            <Input.OTP inputType="numeric" length={6} className="verification-otp" size="large" autoFocus />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="auth-button" 
              loading={loading} 
              block 
              size="large"
            >
              Verify Email
            </Button>
          </Form.Item>
        </Form>

        <div className="verification-actions">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleClose}>
            Back to Login
          </Button>

          <Button type="link" disabled={resendDisabled} onClick={handleResendVerificationCode}>
            {resendDisabled ? `Resend code in ${countdown}s` : "Resend code"}
          </Button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Didn't receive the code? Check your spam folder or click "Resend code"
          </Text>
        </div>

      </div>
    </Modal>
  )
}

export default EmailVerification