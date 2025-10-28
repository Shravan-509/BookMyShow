import { Alert, Button, Form, Input, Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectShowForgotPasswordModal, setShowForgotPasswordModal } from '../../../redux/slices/uiSlice';
import { CheckCircleOutlined, CloseCircleOutlined, LockOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import { 
        forgotPasswordRequest,
        selectForgotPasswordLoading,
        selectForgotPasswordError, 
        selectEmailSent, 
        resetForgotPasswordState
    } from '../../../redux/slices/forgotPasswordSlice';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [currentEmail, setCurrentEmail] = useState("");

    const isOpen = useSelector(selectShowForgotPasswordModal);
    const loading = useSelector(selectForgotPasswordLoading);
    const error = useSelector(selectForgotPasswordError);
    const emailSent = useSelector(selectEmailSent);

    //Reset state when modal closes
    useEffect(() => {
        if(!isOpen)
        {
            // Reset all forgot password state when modal is closed
            dispatch(resetForgotPasswordState());
            setCurrentEmail("")
            form.resetFields();
        }
    }, [isOpen, dispatch, form])

    const handleSubmit = (values) => {
        setCurrentEmail(values.email);
        dispatch(forgotPasswordRequest(values.email))
    }

     const handleCancel = () => {
        //Close Modal and Reset
        dispatch(setShowForgotPasswordModal(false));
    }

    const handleResendEmail = () => {
        if(currentEmail) {
            dispatch(forgotPasswordRequest(currentEmail));
        }
    }

  return (
    <Modal
        title={null}
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        width={600}
        destroyOnClose={true}
        className="forgot-password-modal"
        closeIcon={<CloseCircleOutlined className="text-white! text-lg!" />}
    >
        <div className="bg-linear-to-br from-red-700 to-red-900 rounded-t-lg p-6 -mt-5 -mx-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white m-0">Forgot Password</h2>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <LockOutlined className="text-white! text-xl!" />
                </div>
            </div>
            <div className="mt-2 text-white/80 text-sm">Don't worry! It happens to the best of us.</div>
        </div>

        <div className="p-6 pt-8 bg-linear-to-b from-gray-50 to-white rounded-b-lg"></div>
        {
            !emailSent ? (
                <Form
                    form={form}
                    name="forgot-password"
                    onFinish={handleSubmit}
                    layout='vertical'
                    requiredMark={false}
                >
                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                <MailOutlined className="text-red-600!" />
                            </div>
                            <div>
                                <h3 className="text-gray-800 font-medium m-0">Reset your password</h3>
                                <p className="text-gray-500 text-sm m-0">Enter your email and we'll send you instructions</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Form.Item>
                            <Alert 
                                message="Error" 
                                description={error} 
                                type="error" 
                                showIcon 
                                className="mb-4! border-l-4! border-l-red-500! shadow-sm!"
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email!' },
                            { type: "email", message: "Please enter a valid email!" },
                        ]}
                    >
                        <Input 
                            prefix={<MailOutlined className="text-gray-400!"/>} 
                            placeholder='Enter your email' 
                            size="large"
                            className="py-2!"
                            />
                    </Form.Item>

                    <div className="mt-8">
                        <Button 
                            type='primary' 
                            htmlType='submit' 
                            loading={loading} 
                            block 
                            size='large'
                            // className="!bg-[#f84464] hover:!bg-[#dc3558] !border-none mb-4"
                            className="bg-red-600! hover:bg-red-700! border-red-600! h-12! flex! items-center! justify-center!"
                            icon={loading ? null : <SendOutlined />}
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>

                        <div className="mt-4 text-center">
                            <Button 
                                type="link" 
                                onClick={handleCancel} 
                                block 
                                size="large"
                                className="text-gray-600! hover:text-[#dc3558]!"
                            >
                                Back to Login
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-center">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-[#f84464] text-xs font-bold">i</span>
                            </div>
                            <p className="text-xs text-gray-500">For security reasons, the reset link will expire in 1 hour</p>
                        </div>
                    </div>
                </Form>
            ) 
            : 
            (
                <div className='text-center py-4'>
                    <div className='mb-8 mt-4'>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <CheckCircleOutlined className="text-4xl! text-green-600!"/>
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-800">Check your email</h3>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-w-xs mx-auto">
                            <p className="text-gray-600 text-sm mb-1">We've sent a password reset link to:</p>
                            <p className="font-medium text-gray-800 break-all">{currentEmail}</p>
                        </div>
                        <p className="text-gray-500 text-sm">
                            Please check your inbox and follow the instructions to reset your password
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button 
                            onClick={handleResendEmail} 
                            loading={loading} 
                            className="text-sm! border-red-200! text-red-600! hover:text-red-700! hover:border-red-300!"
                            icon={<SendOutlined />}
                        >
                            Didn't receive the email? Resend
                        </Button>
                        <div className="pt-2">
                            <Button 
                                type="primary" 
                                onClick={handleCancel} 
                                size="large" 
                                block
                                className="bg-red-600! hover:bg-red-700! border-red-600! rounded-lg! h-12!"
                            >
                                Back to Login
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }
    </Modal>
  )
}

export default ForgotPassword