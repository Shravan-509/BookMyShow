import React from 'react';
import { Button, Checkbox, Form, Input, message, Radio, Space } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import EmailVerification from './EmailVerification';
import { selectAuthLoading, signupRequest } from '../../../redux/slices/authSlice';
import { selectActiveTab } from '../../../redux/slices/uiSlice';

const Register = () => {
    const [signupForm] = Form.useForm();
   
    const loading = useSelector(selectAuthLoading);
    const activeTab = useSelector(selectActiveTab)
    const dispatch = useDispatch();
    
    const handleSignup = (values) => {
        dispatch(signupRequest
            ({
                name: values.name,
                email: values.email,
                phone: values.phone,
                password: values.password,
                role: values.role

            })
        )
    }

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
                <Form.Item
                    name="name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                >
                    <Input id='name' prefix={<UserOutlined />} placeholder='Full Name' size="large"/>
                </Form.Item>
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: "email", message: "Please enter a valid email" }
                    ]}
                >
                    <Input id='email'  prefix={<MailOutlined />} placeholder='Email' size="large"/>
                </Form.Item>
                <Form.Item
                    name="phone"
                    rules={[
                        { required: true, message: "Please enter your phone number" },
                        { pattern: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit phone number" },
                    ]}
                >
                    <Input id='phone' prefix={<PhoneOutlined />} placeholder="Phone Number" size="large" />
                </Form.Item>
                <Form.Item
                    name="password"
                    help="Minimum 8 characters"
                    rules={[
                        { required: true, message: 'Please input your password!' },
                        { min: 8, message: "Password must be at least 8 characters" },
                    ]}
                >
                    <Input.Password id='password' prefix={<LockOutlined />} placeholder="Password" size="large" />
                </Form.Item>
                <Form.Item
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                            return Promise.resolve()
                        }
                        return Promise.reject(new Error("The two passwords do not match"))
                        },
                    }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
                </Form.Item>
                <Form.Item
                    label="Register as a Partner"
                    name={'role'}
                    initialValue="user"
                    rules={[{ required: true, message: "Please select an option"}]}
                >
                    <Radio.Group name="radiogroup"zw>
                        <Space direction="horizontal">
                            <Radio value={"partner"}>Yes</Radio>
                            <Radio value={"user"}>No</Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    name="agreement"
                    valuePropName="checked"
                    rules={[
                    {
                        validator: (_, value) =>
                        value ? Promise.resolve() : Promise.reject(new Error("Please accept the terms and conditions")),
                    },
                    ]}
                >
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

            <EmailVerification />
        </>
    )
};
export default Register;