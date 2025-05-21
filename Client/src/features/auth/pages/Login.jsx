import React from 'react';
import { Alert, Button, Checkbox, Divider, Form, Input, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { FacebookOutlined, GoogleOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import TwoFactorAuthentication from './TwoFactorAuthentication';
import ReverifyAccount from './ReverifyAccount';
import { clearLoginError, selectActiveTab, selectLoginError } from '../../../redux/slices/uiSlice';
import { loginRequest, selectAuthLoading } from '../../../redux/slices/authSlice';
import { 
        selectShowReverifyAccountModal, 
        selectShowTwoFactorAuthModal, 
        setShowReverifyAccountModal } from '../../../redux/slices/verificationSlice';

const Login = () => {
    const dispatch = useDispatch();
    const [loginForm] = Form.useForm();
    const loginError = useSelector(selectLoginError);
    const loading = useSelector(selectAuthLoading);
    const activeTab = useSelector(selectActiveTab);
    const isTwoFactorModalOpen = useSelector(selectShowTwoFactorAuthModal);
    const isReverifyAccountModalOpen = useSelector(selectShowReverifyAccountModal);
   
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
    
    return(
        <>
            <Form form={loginForm}
                name="login"
                onFinish={handleLogin}
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

           {isTwoFactorModalOpen && <TwoFactorAuthentication/> }
            {isReverifyAccountModalOpen && <ReverifyAccount/> }
        </>
    )
};
export default Login;