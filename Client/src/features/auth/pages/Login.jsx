import React, { useEffect } from 'react';
import { Alert, Button, Checkbox, Divider, Form, Input, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { FacebookOutlined, GoogleOutlined, LockOutlined, MailOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import TwoFactorAuthentication from './TwoFactorAuthentication';
import ReverifyAccount from './ReverifyAccount';
import ForgotPassword from './ForgotPassword';
import { 
        clearLoginError, 
        selectActiveTab, 
        selectLoginError,
        selectShowForgotPasswordModal,
        setShowForgotPasswordModal
    } from '../../../redux/slices/uiSlice';
import { loginRequest, selectAuthLoading } from '../../../redux/slices/authSlice';
import { 
    selectShowEmailVerificationModal,
        selectShowReverifyAccountModal, 
        selectShowTwoFactorAuthModal, 
        setShowReverifyAccountModal 
    } from '../../../redux/slices/verificationSlice';
import { resetForgotPasswordState } from '../../../redux/slices/forgotPasswordSlice';
import EmailVerification from './EmailVerification';

const Login = () => {
    const dispatch = useDispatch();
    const [loginForm] = Form.useForm();
    const loginError = useSelector(selectLoginError);
    const loading = useSelector(selectAuthLoading);
    const activeTab = useSelector(selectActiveTab);
    const isTwoFactorModalOpen = useSelector(selectShowTwoFactorAuthModal);
    const isReverifyAccountModalOpen = useSelector(selectShowReverifyAccountModal);
    const isForgotPasswordModalOpen = useSelector(selectShowForgotPasswordModal);

    const isEmailVerificationModalOpen = useSelector(selectShowEmailVerificationModal);
   
    // Clean up forgot password state when login component mounts
    useEffect(() => {
        dispatch(resetForgotPasswordState());
    }, [dispatch])

    const handleLogin = (values) => {
        dispatch(loginRequest(values));
    }

    const handleReverifyAccount = () => {
       dispatch(setShowReverifyAccountModal(true));
       dispatch(clearLoginError());
    } 

    const handleSocialLogin = (provider) => {
        message.info(`${provider} login coming soon!`)
    }

    const handleForgotPassword = () => {
        //Reset any previous forgot password state before opening modal
        dispatch(resetForgotPasswordState());
        dispatch(setShowForgotPasswordModal(true));
    }
    
    return(
        <>
            <Form 
                form={loginForm}
                name="login"
                onFinish={handleLogin}
                autoComplete="off"
                layout='vertical'
                requiredMark={false}
            >
                { 
                    loginError && (
                        <Form.Item>
                            <Alert
                                message="Account Not Verified"
                                description={
                                        <div>
                                            {loginError}
                                            <Button 
                                                type="link" 
                                                onClick={handleReverifyAccount} 
                                                style={{ padding: "0 0 0 4px" }}
                                            >
                                                Verify now
                                            </Button>
                                        </div>
                                    }
                                type="warning"
                                showIcon
                            />
                        </Form.Item>
                    )
                }
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email!' },
                        { type: "email", message: "Please enter a valid email!" }
                    ]}
                    hasFeedback
                >
                    <Input id='email' type='email' prefix={<MailOutlined className="!text-gray-400" />} placeholder='Email' size="large"/>
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[
                        { required: true, message: 'Please enter your password!' },
                        { min: 8, message: "Password must be at least 8 characters!" },
                        {
                            pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                            message: 
                            "Password must include at least one uppercase letter, one number, and one special character",
                        },
                    ]}
                    hasFeedback
                >
                    <Input.Password id='password' prefix={<LockOutlined className="!text-gray-400"/>} placeholder='Password' size="large" />
                </Form.Item>
                <Form.Item>
                    <div className="auth-remember-forgot">
                        <Checkbox>Remember me</Checkbox>
                        <button
                            type='button'
                            onClick={handleForgotPassword}
                            className="forgot-link text-red-600 hover:text-text-700 cursor-pointer bg-transparent border-none p-0"
                        >
                            <QuestionCircleOutlined className="mr-1" /> Forgot Password?
                        </button>
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

            <div className="auth-footer">
                <Button type="link" onClick={handleReverifyAccount} className="reverify-link">
                    Need to verify your account?
                </Button>
            </div>

            { isTwoFactorModalOpen && <TwoFactorAuthentication/> }
            { isReverifyAccountModalOpen && <ReverifyAccount/> }
            { isForgotPasswordModalOpen && <ForgotPassword/> }
            {isEmailVerificationModalOpen && <EmailVerification/>}
        </>
    )
};
export default Login;