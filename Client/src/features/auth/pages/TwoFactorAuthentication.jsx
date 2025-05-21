import React from 'react'
import { ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons'
import { Button, Modal, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  resendCodeRequest,
  selectCountdown,
  selectResendDisabled,
  selectShowTwoFactorAuthModal, 
  selectVerificationEmail,
  selectVerificationLoading,
  setShowTwoFactorAuthModal,
  verifyTwoFactorRequest
} from '../../../redux/slices/verificationSlice';

const TwoFactorAuthentication = () => {
  const [twoFactorForm] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isOpen = useSelector(selectShowTwoFactorAuthModal);
  
  const verificationEmail = useSelector(selectVerificationEmail);
  const loading = useSelector(selectVerificationLoading);
  const resendDisabled = useSelector(selectResendDisabled);
  const countdown = useSelector(selectCountdown);

  console.log(isOpen,verificationEmail, loading, resendDisabled, countdown )
  const handleVerifyTwoFactor = (values) => {
    dispatch(verifyTwoFactorRequest({ code: values.code }))
  }

  const handleClose = () => {
    dispatch(setShowTwoFactorAuthModal(false));
  }

  const handleResendVerificationCode = () => {
    dispatch(resendCodeRequest({ type: "2fa" }))
  }

  return (
    <Modal
      title="Two-Factor Authentication"
      open={isOpen}
      footer={null}
      closable={false}
      centered
      className="verification-modal"
    >
      <div className="verification-content">
        <div className="verification-icon">
          <KeyOutlined />
        </div>
        <h3>Enter Security Code</h3>
        <p>
          We've sent a security code to <strong>{verificationEmail}</strong>
        </p>

        <Form form={twoFactorForm} onFinish={handleVerifyTwoFactor} layout="vertical">
          <Form.Item name="code" rules={[{ required: true, message: "Please enter the security code" }]}>
            <Input.OTP inputType="numeric" length={6} className="verification-otp" size="large" autoFocus />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block size="large">
              Verify
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

export default TwoFactorAuthentication

