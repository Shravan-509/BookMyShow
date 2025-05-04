import { ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons'
import { Button, Modal, Form, Input, message } from 'antd'
import React, { useState } from 'react'
import { Verify2FA } from '../../../api/auth';
import { useNavigate } from 'react-router-dom';
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice';
import { useDispatch, useSelector } from 'react-redux';

const TwoFactorAuthentication = ({
  verificationEmail,
  showTwoFactorAuthModal,
  setShowTwoFactorAuthModal,
  tempUserId,
  loginForm,
  resendDisabled,
  countDown
}) => {
  const [twoFactorForm] = Form.useForm();
  
  const {loading} = useSelector((state) => state.loader);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleResendVerificationCode = async (type) => {
  }

  const handleVerifyTwoFactor = async (values) => {
    try 
    {
      dispatch(showLoading());
      
      const payload = {
          userId : tempUserId,
          code: values.code
      }
      const res = await Verify2FA(payload);
      if(res?.success)
      {
          message.success(res?.message);
          
          // Delay transition to let toast show
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          setShowTwoFactorAuthModal(false); 
          loginForm.resetFields();
          twoFactorForm.resetFields(); 
          // localStorage.setItem("access_token", res?.access_token);
          navigate("/home"), { replace: true };
                    
      }
      else
      {     
          message.warning(res?.response?.data?.message);
      }

    } catch (error) {
      message.error(error);
    } finally{
     dispatch(hideLoading());
    }
  }

  return (
    <Modal
      title="Two-Factor Authentication"
      open={showTwoFactorAuthModal}
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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setShowTwoFactorAuthModal(false)}>
            Back
          </Button>

          <Button type="link" disabled={resendDisabled} onClick={() => handleResendVerificationCode("2fa")}>
            {resendDisabled ? `Resend code in ${countDown}s` : "Resend code"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TwoFactorAuthentication

