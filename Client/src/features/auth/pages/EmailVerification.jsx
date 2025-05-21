import React from 'react'
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Modal, Form, Input } from 'antd'
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
        <div className="verification-icon">
          <MailOutlined />
        </div>
        <h3>Verify Your Email</h3>
        <p>
          We've sent a verification code to <strong>{verificationEmail}</strong>
        </p>

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
            Back
          </Button>

          <Button type="link" disabled={resendDisabled} onClick={handleResendVerificationCode}>
            {resendDisabled ? `Resend code in ${countdown}s` : "Resend code"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EmailVerification