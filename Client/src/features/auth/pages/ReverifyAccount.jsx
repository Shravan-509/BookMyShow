import React from 'react'
import { ExclamationCircleOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Typography } from 'antd'
import { useDispatch, useSelector } from 'react-redux';
import { 
  reverifyAccountRequest,
  selectShowReverifyAccountModal, 
  selectVerificationEmail, 
  selectVerificationLoading,
  setShowReverifyAccountModal
} from '../../../redux/slices/verificationSlice';

const { Text } = Typography

const ReverifyAccount = () => {
    const [reverifyForm] = Form.useForm();
    const dispatch = useDispatch();
    const isOpen = useSelector(selectShowReverifyAccountModal);
    const verificationEmail = useSelector(selectVerificationEmail);
    const loading = useSelector(selectVerificationLoading);
    
    const submitReverifyRequest = (values) => {
      dispatch(reverifyAccountRequest({ email: values.email }))
    }

    const handleClose = () => {
      dispatch(setShowReverifyAccountModal(false));
    }

  return (
    <Modal
      title="Verify Your Account"
      open={isOpen}
      footer={null}
      closable={true}
      onCancel={handleClose}
      centered
      className="verification-modal"
    >
      <div className="verification-content">
        <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md animate-pulse ring-2 ring-yellow-300">
            <ExclamationCircleOutlined className="!text-5xl !text-yellow-600"/>
        </div>
        {/* <div className="verification-icon reverify-icon">
          <ExclamationCircleOutlined />
        </div> */}
        <h3>Account Verification</h3>
        <p>Your account needs to be verified before you can log in. Please enter your email address to receive a new
          verification code.</p>

        <Form form={reverifyForm} onFinish={submitReverifyRequest} layout="vertical">
          <Form.Item
            name="email"
            initialValue={verificationEmail}
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email Address" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block size="large">
              Send Verification Code
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            After clicking "Send Verification Code", you'll receive an email with a 6-digit code. The verification modal
            will appear automatically for you to enter the code.
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export default ReverifyAccount