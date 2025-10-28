import React, { useEffect } from 'react';
import { MailOutlined, PhoneOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useProfile } from '../../../hooks/useProfile';

const {Title, Text, Paragraph} = Typography;

const Personal_InfoTab = () => {
    const [profileForm] = Form.useForm();
    const { 
            profile, 
            profileUpdateLoading, 
            profileUpdateError, 
            updateProfile, 
            clearErrors 
        } = useProfile()
    
    useEffect(() => {
        if(profile){
            profileForm.setFieldsValue({
                name: profile.name || "",
                phone: profile.phone || "",
                email: profile.email || ""
            })
        }
    }, [profile?.name, profile?.phone, profile?.email]);

    const handleSubmit = (values) => {
        updateProfile({
            name: values.name,
            phone: values.phone,
        })
    }

    const handleFormChange = () => {
        // Clear errors when user starts typing
        if (profileUpdateError) {
            clearErrors()
        }
    }
    
  return (
    <Card 
        title={
            <Title level={4} className="mb-0! text-[#f84464]!">
            Personal Information
            </Title>
        }
        className="rounded-xl!"
        styles={{
            body: {
                padding: '24px'
            }
        }}
    >
        <Paragraph className="text-gray-500 mb-6 text-sm">
            Update your personal details below. Your email can be changed in the {' '}
            <Text strong>Email Settings</Text> tab.
        </Paragraph>

         {profileUpdateError && (
            <Alert
                message="Update Failed"
                description={profileUpdateError}
                type="error"
                showIcon
                closable
                onClose={clearErrors}
                className="mb-4!"
            />
        )}

        <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={handleFormChange}
            disabled={profileUpdateLoading}
        >
            <Form.Item
                name="name"
                label={<Text strong>Full Name</Text>}
                rules={[
                    { required: true, message: "Please enter your full name" },
                    { min: 2, message: "Name must be at least 2 characters" },
                    { max: 50, message: "Name must not exceed 50 characters" },
                ]}
            >
                <Input 
                    prefix={<UserOutlined style={{ marginRight: 8 }} />} 
                    placeholder="Enter your full name" 
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="phone"
                label={<Text strong>Phone Number</Text>}
                rules={[
                    { required: true, message: "Please enter your phone number" },
                    { 
                        pattern: /^[6-9]\d{9}$/, 
                        message: "Please enter a valid 10-digit phone number"
                    },
                ]}
            >
            <Input 
                prefix={<PhoneOutlined style={{ marginRight: 8 }}/>} 
                placeholder="Enter your phone number" 
                size="large"
            />
            </Form.Item>

            <Form.Item 
                name="email" 
                label={<Text strong>Email Address</Text>}
            >
                <Input
                    prefix={<MailOutlined style={{ marginRight: 8 }} />}
                    disabled
                    size="large"
                    suffix={
                        <span className="text-xs text-gray-400">
                            Change in Email Settings
                        </span>
                    }
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={profileUpdateLoading}
                    size="large"
                    className='bg-[#f84464]! hover:bg-[#dc3558]! text-white! mt-2'
                >
                    Save Changes
                </Button>
            </Form.Item>
        </Form>
    </Card>
  )
}

export default Personal_InfoTab