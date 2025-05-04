import { ExclamationCircleOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, message, Modal } from 'antd'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice';
import { ReverifyEmail } from '../../../api/auth';

const ReverifyAccount = ({
    showReverifyAccountModal,
    setShowReverifyAccountModal,
    verificationEmail,
    setVerificationEmail,
    setTempUserId,
    setShowEmailVerificationModal,
    setResendDisabled,
    setCountDown
}) => {
    const [reverifyForm] = Form.useForm();
    const {loading} = useSelector((state) => state.loader);
    const dispatch = useDispatch();

    const submitReverifyRequest = async (values) => {
      try 
      {
        dispatch(showLoading());
        
         // Call reverify API
        const res = await ReverifyEmail({email: values.email});
        
        if(res?.success)
          {
              message.success(res?.message);
              
              // Show email verification screen
              setVerificationEmail(values.email)
              setTempUserId(res.data.userId)
              setShowReverifyAccountModal(false);
              setShowEmailVerificationModal(true);
        
              // Start countdown for resend button
              setResendDisabled(true)
              setCountDown(60)
          }

      } catch (error) {
        message.error(error.message || "Reverification request failed. Please try again.")
      } finally {
        dispatch(hideLoading())
      }
    }

  return (
    <Modal
      title="Verify Your Account"
      open={showReverifyAccountModal}
      footer={null}
      closable={true}
      onCancel={() => setShowReverifyAccountModal(false)}
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
      </div>
    </Modal>
  )
}

export default ReverifyAccount