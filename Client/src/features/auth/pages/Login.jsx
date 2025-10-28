import React, { useEffect, memo, useCallback, useMemo } from 'react';
import { Alert, Button, Checkbox, Divider, Form, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { FacebookOutlined, GoogleOutlined, LockOutlined, MailOutlined, QuestionCircleOutlined } from '@ant-design/icons';
const TwoFactorAuthentication = React.lazy(() => import("./TwoFactorAuthentication"))
const ReverifyAccount = React.lazy(() => import("./ReverifyAccount"))
const ForgotPassword = React.lazy(() => import("./ForgotPassword"))
const EmailVerification = React.lazy(() => import("./EmailVerification"))
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
import { notify } from '../../../utils/notificationUtils';

const Login = memo(() => {
    const dispatch = useDispatch();
    const [loginForm] = Form.useForm();
    const loginError = useSelector(selectLoginError);
    const loading = useSelector(selectAuthLoading);
    const activeTab = useSelector(selectActiveTab);
    const isTwoFactorModalOpen = useSelector(selectShowTwoFactorAuthModal);
    const isReverifyAccountModalOpen = useSelector(selectShowReverifyAccountModal);
    const isForgotPasswordModalOpen = useSelector(selectShowForgotPasswordModal);``
    const isEmailVerificationModalOpen = useSelector(selectShowEmailVerificationModal);

    const handleLogin = useCallback(
        (values) => {
            dispatch(loginRequest(values));
        }, [dispatch]
    )

    const handleReverifyAccount = useCallback(() => {
       dispatch(setShowReverifyAccountModal(true));
       dispatch(clearLoginError());
    },[dispatch]) 

    const handleSocialLogin = useCallback((provider) => {
        notify("info", `${provider} login coming soon!`);
    },[])

    const handleForgotPassword = useCallback(() => {
        //Reset any previous forgot password state before opening modal
        dispatch(resetForgotPasswordState());
        dispatch(setShowForgotPasswordModal(true));
    }, [dispatch])

    const emailRules = useMemo(
        () => [
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
            ],
        [],
    )

    const passwordRules = useMemo(
        () => [
                { required: true, message: "Please enter your password!" },
                { min: 8, message: "Password must be at least 8 characters!" },
                {
                    pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                    message: "Password must include at least one uppercase letter, one number, and one special character",
                },
            ],
        [],
    )

    // Clean up forgot password state when login component mounts
    useEffect(() => {
        dispatch(resetForgotPasswordState());
    }, [dispatch])
    
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
                <Form.Item name="email" rules={emailRules} hasFeedback>
                    <Input 
                        id='email' 
                        type='email' 
                        prefix={<MailOutlined className="text-gray-400!" />} 
                        placeholder='Email' 
                        size="large"
                    />
                </Form.Item>
                <Form.Item name="password" rules={passwordRules} hasFeedback>
                    <Input.Password 
                        id='password' 
                        prefix={<LockOutlined className="text-gray-400!"/>} 
                        placeholder='Password' 
                        size="large" 
                    />
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
            
            <React.Suspense fallback= {<div>Loading...</div>}>
                { isTwoFactorModalOpen && <TwoFactorAuthentication/> }
                { isReverifyAccountModalOpen && <ReverifyAccount/> }
                { isForgotPasswordModalOpen && <ForgotPassword/> }
                {isEmailVerificationModalOpen && <EmailVerification/>}
            </React.Suspense>
        </>
    )
});

Login.displayName = "Login"
export default Login;