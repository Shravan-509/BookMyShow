import React from 'react';
import { Button, Checkbox, Form, Input, message, Radio } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterUser } from '../api/user';

const Register = () => {
    const navigate = useNavigate();
    const onFinish = async (values) => {
        try {
            const res = await RegisterUser(values);
            if(res?.success)
            {
                message.success(res?.message);
                navigate("/login");
            }
            else
            {
                message.warning(res?.response?.data?.message);
            }
         
        } catch (error) {
            message.error(error);
        }
      };

    return(
        <div className='App-header'>
            <main className='main-area mw-500 text-center px-3'>
                <section>
                    <h1>Register to BookMyShow</h1>
                </section>
                <section>
                    <Form
                        name="basic"
                        labelCol={{ span: 12 }}
                        className="d-block"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout='vertical'
                    >
                        <Form.Item
                            label="Name"
                            htmlFor="name"
                            name="name"
                            className="d-block"
                            rules={[{ required: true, message: 'Please input your name!' }]}
                        >
                            <Input id='name' type='text' placeholder='Enter your Name'/>
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            htmlFor="email"
                            name="email"
                            className="d-block"
                            rules={[{ required: true, message: 'Please input your email!' }]}
                        >
                            <Input id='email' type='email' placeholder='Enter your Email'/>
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            htmlFor="password"
                            name="password"
                            className="d-block"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password id='password' placeholder='Enter your Password' />
                        </Form.Item>

                        <Form.Item
                            label="Register as a Partner"
                            htmlFor='role'
                            name={'role'}
                            className='d-block text-center'
                            initialValue={false}
                            rules={[{ required: true, message: "Please select an option!"}]}
                        >
                            <div className='d-flex justify-content-start'>
                                <Radio.Group name="radiogroup" className='flex-start'>
                                    <Radio value={"partner"}>Yes</Radio>
                                    <Radio value={"user"}>No</Radio>
                                </Radio.Group>
                            </div>
                        </Form.Item>
                        <Form.Item>
                            <Button 
                                type="primary"
                                block
                                htmlFor="submit"
                                htmlType="submit"
                                style={{ fontSize: "1rem", fontWeight: "600" }}
                            >
                                Register
                            </Button>
                        </Form.Item>
                    </Form>
                </section>
                <section>
                    <p>
                        Already a User ? <Link to= "/login">Login Now</Link>
                    </p>
                </section>
            </main>
        </div>
    )
};
export default Register;