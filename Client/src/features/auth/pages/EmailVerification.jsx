import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Modal, Form, Input, message } from 'antd'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VerifyEmail } from '../../../api/auth'
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice'

const EmailVerification = ({
    verificationEmail,
    showEmailVerificationModal, 
    setShowEmailVerificationModal, 
    tempUserId,
    setActiveTab,
    signupForm,
    resendDisabled,
    countDown
}) => {
      const [verifyEmailForm] = Form.useForm();
      const {loading} = useSelector((state) => state.loader);
      const dispatch = useDispatch();
    
      const handleResendVerificationCode = async (type) => {
      }
    
      const handleVerifyEmail = async (values) => {
        try {
            dispatch(showLoading());
            
            const payload = {
                userId : tempUserId,
                code: values.code
            }

            const res = await VerifyEmail(payload);
            if(res?.success)
            {
                message.success(res?.message);
                
                // Delay transition to let toast show
                setTimeout(() => {
                  setShowEmailVerificationModal(false); 
                  signupForm.resetFields();
                  verifyEmailForm.resetFields(); 
                }, 1000);   
                setActiveTab("login");

            }
            else
            {     
                message.warning(res?.response?.data?.message);
            }

        } catch (error) {
          message.error(error);
        }finally{
            dispatch(hideLoading()); 
        }
    
      }

  return (
    <Modal
      title="Email Verification"
      open={showEmailVerificationModal}
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
            <Button type="primary" htmlType="submit" className="auth-button" loading={loading} block size="large">
              Verify Email
            </Button>
          </Form.Item>
        </Form>

        <div className="verification-actions">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setShowEmailVerificationModal(false)}>
            Back
          </Button>

          <Button type="link" disabled={resendDisabled} onClick={() => handleResendVerificationCode("email")}>
            {resendDisabled ? `Resend code in ${countDown}s` : "Resend code"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EmailVerification