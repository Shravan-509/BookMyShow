import React from 'react';
import '@ant-design/v5-patch-for-react-19';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { LoginUser } from '../api/user';
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../redux/loaderSlice';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onFinish = async (values) => {
        try 
        {
            dispatch(showLoading());
            const res = await LoginUser(values);
            if(res?.success)
            {
                message.success(res?.message);
                localStorage.setItem("access_token", res?.access_token);
                navigate("/");
            }
            else
            {
                message.warning(res?.response?.data?.message);
            }
        } 
        catch (error) {
            message.error(error);
        } finally{
            dispatch(hideLoading())
        }
    }
      
    return(
        <div className='App-header'>
            <main className='main-area mw-500 text-center px-3'>
                <section>
                    <h1>Login to BookMyShow</h1>
                </section>
                <section>
                    <Form
                        name="basic"
                        labelCol={{ span: 8 }}
                        className="d-block"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout='vertical'
                    >
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

                        <Form.Item name="remember" valuePropName="checked" label={null}>
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary"
                                block
                                htmlFor="submit"
                                htmlType="submit"
                                style={{ fontSize: "1rem", fontWeight: "600" }}
                            >
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </section>
                <section>
                    <p>
                        New User ? <Link to= "/register">Register Here</Link>
                    </p>
                </section>
            </main>
        </div>
    )
};
export default Login;