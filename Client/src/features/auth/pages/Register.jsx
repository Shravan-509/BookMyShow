import React, { useEffect, memo, useCallback, useMemo } from 'react';
import { Button, Checkbox, Form, Input, Radio, Space } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
const EmailVerification = React.lazy(() => import("./EmailVerification"))
import { selectAuthLoading, signupRequest } from '../../../redux/slices/authSlice';
import { selectActiveTab } from '../../../redux/slices/uiSlice';
import { resetVerificationState } from '../../../redux/slices/verificationSlice';

const Register = memo(() => {
    const [signupForm] = Form.useForm();
   
    const loading = useSelector(selectAuthLoading);
    const activeTab = useSelector(selectActiveTab)
    const dispatch = useDispatch();

    const nameRules = useMemo(() => [{ required: true, message: "Please enter your name!" }], [])

    const emailRules = useMemo(
        () => [
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
            ],
        [],
    )

    const phoneRules = useMemo(
        () => [
                { required: true, message: "Please enter your phone number!" },
                { pattern: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit phone number!" },
            ],
        [],
    )

    const passwordRules = useMemo(
        () => [
                { required: true, message: "Please input your password!" },
                { min: 8, message: "Password must be at least 8 characters!" },
                {
                    pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                    message: "Password must include at least one uppercase letter, one number, and one special character",
                },
            ],
        [],
    )

    const confirmPasswordRules = useMemo(
        () => [
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                        return Promise.resolve()
                    }
                    return Promise.reject(new Error("The two passwords do not match"))
                    },
                }),
            ],
        [],
    )

    const roleRules = useMemo(() => [{ required: true, message: "Please select an option" }], [])

    const agreementRules = useMemo(
        () => [
                {
                    validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error("Please accept the terms and conditions")),
                },
            ],
        [],
    )
    
     const handleSignup = useCallback(
        (values) => {
            dispatch(signupRequest({
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    password: values.password,
                    role: values.role
                })
            )
        },
        [dispatch]
    )
    
    // Clean up Verification state when Regitser component mounts
    useEffect(() => {
        dispatch(resetVerificationState())
    }, [dispatch])

   

    return(
        <>
            <Form
                form={signupForm}
                name="register"
                onFinish={handleSignup}
                autoComplete="off"
                layout='vertical'
                requiredMark={false}
            >
                <Form.Item name="name" rules={nameRules} hasFeedback>
                    <Input 
                        id='name' 
                        prefix={<UserOutlined className="text-gray-400!"/>} 
                        placeholder='Full Name' 
                        size="large"
                    />
                </Form.Item>

                 <Form.Item name="email" rules={emailRules} hasFeedback>
                    <Input 
                        id='email' 
                        prefix={<MailOutlined className="text-gray-400!"/>} 
                        placeholder='Email' 
                        size="large"
                    />
                </Form.Item>

                <Form.Item name="phone" rules={phoneRules} hasFeedback>
                    <Input 
                        id='phone' 
                        prefix={<PhoneOutlined className="text-gray-400!"/>} 
                        placeholder="Phone Number" 
                        size="large" 
                    />
                </Form.Item>

                <Form.Item name="password" rules={passwordRules} hasFeedback>
                    <Input.Password 
                        id='password' 
                        prefix={<LockOutlined className="text-gray-400!"/>} 
                        placeholder="Password" 
                        size="large" 
                    />
                </Form.Item>

                 <Form.Item name="confirmPassword" dependencies={["password"]} rules={confirmPasswordRules} hasFeedback>
                    <Input.Password 
                        prefix={<LockOutlined className="text-gray-400!"/>} 
                        placeholder="Confirm Password" 
                        size="large" 
                    />
                </Form.Item>

                 <Form.Item label="Register as a Partner" name={"role"} initialValue="user" rules={roleRules}>
                    <Radio.Group name="radiogroup">
                        <Space direction="horizontal">
                            <Radio value={"partner"}>Yes</Radio>
                            <Radio value={"user"}>No</Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>

                <Form.Item name="agreement" valuePropName="checked" rules={agreementRules}>
                    <Checkbox>
                        I agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a>
                    </Checkbox>
                </Form.Item>
                
                <Form.Item>
                    <Button 
                        type="primary"
                        block
                        className="auth-button"
                        htmlType="submit"
                        style={{ fontSize: "1rem", fontWeight: "600" }}
                        loading={loading && activeTab === "signup"}
                        size="large"
                    >
                        Create Account
                    </Button>
                </Form.Item>
            </Form>

            <React.Suspense fallback={<div>Loading...</div>}>
                <EmailVerification />
            </React.Suspense>
        </>
    )
});

Register.displayName = "Register"
export default Register;