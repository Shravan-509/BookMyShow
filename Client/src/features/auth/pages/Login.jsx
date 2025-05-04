import React, { useState } from 'react';
import '@ant-design/v5-patch-for-react-19';
import { Alert, Button, Checkbox, Divider, Form, Input, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { LoginUser } from '../../../api/auth';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice';
import { FacebookOutlined, GoogleOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import TwoFactorAuthentication from './TwoFactorAuthentication';
import ReverifyAccount from './ReverifyAccount';

const Login = ({
    activeTab,
    countDown,
    setCountDown,
    resendDisabled,
    setResendDisabled,
    verificationEmail,
    setVerificationEmail,
    showEmailVerificationModal,
    tempUserId,
    setTempUserId,
    setShowEmailVerificationModal
}) => {
    const [loginForm] = Form.useForm();
    const [showTwoFactorAuthModal, setShowTwoFactorAuthModal] = useState(false);
    const [showReverifyAccountModal, setShowReverifyAccountModal] = useState(false)
    const [loginError, setLoginError] = useState("");

    const {loading} = useSelector((state) => state.loader);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onFinish = async (values) => {
        try 
        {
            dispatch(showLoading());
            setLoginError("");
           
            // await new Promise((resolve) => setTimeout(resolve, 1000))
            const res = await LoginUser(values);
            if(res?.success)
            {
                // Check if the error is due to unverified account
                if (res?.data?.code === "UNVERIFIED_ACCOUNT") 
                {
                    setLoginError(res?.message);
                    setVerificationEmail(values.email)
                    return;
                }

                message.success(res?.message);
                if(res?.data?.requiresTwoFactor)
                {
                    // show 2FA Verification screen
                    setVerificationEmail(values.email);
                    setTempUserId(res?.data.userId);
                    setShowTwoFactorAuthModal(true);

                    // Start countdown for resend button on initial 2FA code
                    setResendDisabled(true)
                    setCountDown(60);
                }
                else
                {
                    // localStorage.setItem("access_token", res?.access_token);
                    navigate("/home", { replace: true });
                }
            }
            else
            {
                message.warning(res?.response?.data?.message);
            }
        } 
        catch (error) {
            console.log(error)
            message.error(error);
        } finally{
            dispatch(hideLoading())
        }
    }

    const handleReverifyAccount = () => {
        setShowReverifyAccountModal(true)
        setLoginError("")
    }

    const handleSocialLogin = (provider) => {
        message.info(`${provider} login coming soon!`)
      }
    
      
    return(
        <>
            <Form form={loginForm}
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                layout='vertical'
                requiredMark={false}
            >
                { loginError && (
                    <Form.Item>
                        <Alert
                            message="Account Not Verified"
                            description={
                                <div>
                                    {loginError}
                                    <Button type="link" onClick={handleReverifyAccount} style={{ padding: "0 0 0 4px" }}>
                                        Verify now
                                    </Button>
                                </div>
                            }
                            type="warning"
                            showIcon
                        />
                    </Form.Item>
                )}
                <Form.Item
                    name="email"
                    rules={[{ required: true, message: 'Please enter your email!' }]}
                >
                    <Input id='email' type='email' prefix={<MailOutlined />} placeholder='Email' size="large"/>
                </Form.Item>
                <Form.Item
                    name="password"
                   
                    rules={[{ required: true, message: 'Please enter your password!' }]}
                >
                    <Input.Password id='password' prefix={<LockOutlined />} placeholder='Password' size="large" />
                </Form.Item>
                <Form.Item>
                    <div className="auth-remember-forgot">
                        <Checkbox>Remember me</Checkbox>
                        <a href="#" className="forgot-link">
                            Forgot Password?
                        </a>
                    </div>
                </Form.Item>
                <Form.Item>
                    <Button 
                        type="primary"
                        htmlType="submit"
                        className="auth-button"
                        block
                        size="large"
                        loading={loading && activeTab === "login"}
                    >
                        Login
                    </Button>
                </Form.Item>
            </Form>
            
            <Divider plain>or continue with</Divider>

            <div className="social-login">
                <Button
                icon={<GoogleOutlined />}
                onClick={() => handleSocialLogin("Google")}
                className="social-button google"
                size="large"
                >
                Google
                </Button>
                <Button
                icon={<FacebookOutlined />}
                onClick={() => handleSocialLogin("Facebook")}
                className="social-button facebook"
                size="large"
                >
                Facebook
                </Button>
            </div>

            <TwoFactorAuthentication
                verificationEmail= {verificationEmail}
                showTwoFactorAuthModal={showTwoFactorAuthModal}
                setShowTwoFactorAuthModal={setShowTwoFactorAuthModal}
                tempUserId = {tempUserId}
                loginForm={loginForm}
                resendDisabled = {resendDisabled}
                countDown= {countDown}
            />
            <ReverifyAccount
                showReverifyAccountModal = {showReverifyAccountModal}
                setShowReverifyAccountModal = {setShowReverifyAccountModal}
                verificationEmail = {verificationEmail}
                setVerificationEmail = {setVerificationEmail}
                setTempUserId = {setTempUserId}
                showEmailVerificationModal={showEmailVerificationModal}
                setShowEmailVerificationModal={setShowEmailVerificationModal}
                setResendDisabled = {setResendDisabled}
                setCountDown = {setCountDown}
            
            />
        </>
    )
};
export default Login;