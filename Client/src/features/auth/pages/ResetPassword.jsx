import { Alert, Button, Card, Form, Input, message } from 'antd'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { 
    resetPasswordRequest, 
    selectResetPasswordError, 
    selectResetPasswordLoading, 
    selectResetSuccess ,
    resetForgotPasswordState
} from '../../../redux/slices/forgotPasswordSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined, KeyOutlined, LockOutlined } from '@ant-design/icons';

const ResetPassword = () => {
    const [form] = Form.useForm();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const token = searchParams.get("token");
    const loading = useSelector(selectResetPasswordLoading);
    const error = useSelector(selectResetPasswordError);
    const resetSuccess = useSelector(selectResetSuccess);

    useEffect(() => {
        if(!token)
        {
            message.error("Invalid reset link")
            navigate("/", {replace: true});
        }

    }, [token, navigate, dispatch]);

    useEffect(() => {
        if(resetSuccess)
        {
            form.resetFields();
        }
    }, [resetSuccess, form]);

    // Cleanup state when component unmounts or user navigates away
    useEffect(() => {
        return () => {
            dispatch(resetForgotPasswordState())
        }
    }, [dispatch])

    const handleSubmit = (values) => {
        dispatch(resetPasswordRequest({
            token,
            newPassword : values.password,
        }))
    }

    const handleBackToLogin = () => 
    { 
        // Clear state before navigating
        dispatch(resetForgotPasswordState())
        navigate("/", {replace: true}) 
    }

    if(!token){
        return null;
    }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8"'>
        <div className="absolute top-0 left-0 w-full h-64 bg-red-600 opacity-10 transform -skew-y-6">
        </div>
    
        <Card className='!w-full !max-w-md !shadow-2xl !border-0 !overflow-hidden' styles={{ body: { padding: 0 }}}>
            <div className="bg-gradient-to-r from-red-700 to-red-900 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white m-0">Reset Password</h2>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <KeyOutlined className="!text-white !text-xl" />
                    </div>
                </div>
                <p className="text-white/80 text-sm mt-2">Create a new password for your account</p>
            </div>

            <div className="p-6 pt-8 bg-white">
                {
                    resetSuccess ? (
                        // Success state
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <KeyOutlined className="!text-4xl !text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-800">Password Reset Successful!</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Your password has been successfully updated. You can now login with your new password.
                            </p>
                            <div className="space-y-3">
                                <Button
                                    type="primary"
                                    onClick={handleBackToLogin}
                                    size="large"
                                    block
                                    className="!bg-red-600 hover:!bg-red-700 !border-red-600 !h-12"
                                >
                                    Continue to Login
                                </Button>
                            </div>
                        </div>
                    ) 
                    : 
                    (
                        <Form
                            form={form}
                            name="reset-password"
                            onFinish={handleSubmit}
                            layout='vertical'
                            requiredMark={false}
                            disabled={resetSuccess}
                        >
                            {
                                error && (
                                    <Form.Item>
                                        <Alert 
                                            message="Error" 
                                            description={error} 
                                            type='error' 
                                            showIcon 
                                            className="!mb-4 !border-l-4 !border-l-red-500"
                                        />
                                    </Form.Item>
                                )
                            }

                            <div className="mb-6">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                        <LockOutlined className="text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-medium m-0">Create new password</h3>
                                        <p className="text-gray-500 text-sm m-0">
                                            Your new password must be different from previous passwords
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: 'Please enter your new password!' },
                                    { min: 8, message: "Password must be at least 8 characters" },
                                    {
                                        pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                                        message: 
                                        "Password must include at least one uppercase letter, one number, and one special character",
                                    },
                                ]}
                                hasFeedback
                            >
                                <Input.Password 
                                    prefix={<LockOutlined className="!text-gray-400"/>} 
                                    placeholder='New Password' 
                                    size='large' 
                                    className="!py-2"
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: "Please enter your new password!" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if(!value || getFieldValue("password") === value)
                                            {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Passwords do not match!"))
                                        }
                                    })
                                ]}
                                hasFeedback
                            >
                                <Input.Password 
                                    prefix={<LockOutlined className="!text-gray-400"/>} 
                                    placeholder='Confirm New Password' 
                                    size='large' 
                                    className="!py-2"
                                />
                            </Form.Item>

                            <div className="password-strength-meter mt-2 mb-6">
                                <p className="text-xs text-gray-500 mb-1">Password strength:</p>
                                <div className="flex space-x-1">
                                    <div className="h-1 flex-1 rounded-full bg-red-500"></div>
                                    <div className="h-1 flex-1 rounded-full bg-red-300"></div>
                                    <div className="h-1 flex-1 rounded-full bg-gray-200"></div>
                                    <div className="h-1 flex-1 rounded-full bg-gray-200"></div>
                                </div>
                                <p className="text-xs text-red-500 mt-1">Weak - Add special characters</p>
                            </div>

                            <Form.Item>
                                <Button 
                                    type='primary' 
                                    htmlType='submit' 
                                    loading={loading} 
                                    block 
                                    size='large'
                                    className="!bg-red-600 hover:!bg-red-700 !border-red-600 !h-12"
                                >
                                    {loading ? "Resetting Password..." : "Reset Password"}
                                </Button>

                                <div className="mt-4 text-center">
                                    <Button 
                                        type="link" 
                                        onClick={handleBackToLogin}
                                        className="!text-gray-600 hover:!text-red-600"
                                        icon={<ArrowLeftOutlined />}
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    )}
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-center">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-red-600 text-xs font-bold">i</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            For security reasons, please do not share your password with anyone
                        </p>
                    </div>
                </div>
            </div>
        </Card>
        <div className="absolute bottom-4 left-0 w-full text-center">
            <p className="text-white/50 text-xs">Copyright {new Date().getFullYear()} © Shravan Kumar Atti. All rights reserved.</p>
        </div>
    </div>
  )
}

export default ResetPassword