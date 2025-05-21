import { PhoneOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input } from 'antd'
import React from 'react'

const Personalnformation = ({userData, saving}) => {
    const [profileForm] = Form.useForm()
  return (
    <Card title="Profile Details" variant="borderless">
        <Form
            form={profileForm}
            layout="vertical"
            // onFinish={handleUpdateProfile}
            initialValues={{
                name: userData?.name,
                phone: userData?.phone,
            }}
        >
            <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter your name" }]}
            >
                <Input prefix={<UserOutlined />} placeholder="Full Name" size="large"/>
            </Form.Item>

            <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                    { required: true, message: "Please enter your phone number" },
                    { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" },
                ]}
            >
            <Input prefix={<PhoneOutlined />} placeholder="Phone Number" size="large"/>
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                    style={{ backgroundColor: "#e5293e", borderColor: "#e5293e" }}
                >
                    Save Changes
                </Button>
            </Form.Item>
        </Form>
    </Card>
  )
}

export default Personalnformation