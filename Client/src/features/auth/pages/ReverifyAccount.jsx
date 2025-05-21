import React from 'react'
import { ExclamationCircleOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal } from 'antd'
import { useDispatch, useSelector } from 'react-redux';
import { 
  reverifyAccountRequest,
  selectShowReverifyAccountModal, 
  selectVerificationEmail, 
  selectVerificationLoading,
  setShowReverifyAccountModal
} from '../../../redux/slices/verificationSlice';

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
        <div className="verification-icon reverify-icon">
          <ExclamationCircleOutlined />
        </div>
        <h3>Account Verification</h3>
        <p>Please enter your email address to receive a new verification code.</p>

        <Form form={reverifyForm} onFinish={submitReverifyRequest} layout="vertical">
          <Form.Item
            name="email"
            initialValue={{email : verificationEmail}}
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
      </div>
    </Modal>
  )
}

export default ReverifyAccount