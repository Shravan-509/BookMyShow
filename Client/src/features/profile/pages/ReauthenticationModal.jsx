import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal,Typography } from 'antd'
import React from 'react'
import { useAuth } from '../../../hooks/useAuth';
import { useProfile } from '../../../hooks/useProfile';

const { Title, Paragraph, Text } = Typography;

const ReauthenticationModal = () => {
    const { showReauthModal, reauthMessage, hideReauthModal } = useProfile()
    const { logout } = useAuth()

    const handleOk = () => {
        hideReauthModal();
        logout() // This will redirect to login page
    }
    return (
        <Modal
            open={showReauthModal}
            onOk={handleOk}
            onCancel={handleOk}
            closable={false}
            centered
            footer={[
                <Button
                    key="ok"
                    type="primary"
                    onClick={handleOk}
                    className="!bg-[#e5293e] !border-[#e5293e] hover:!bg-[#cc2237]"
                >
                    Go to Login
                </Button>,
            ]}
        >
             <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-4 shadow-md animate-pulse ring-2 ring-red-300">
                    <ExclamationCircleOutlined className="!text-5xl !text-[#e5293e]" />
                </div>
                <Title level={4} className="!text-[#e5293e] !mb-2">
                    Re-authentication Required
                </Title>
        
                <Paragraph className="!text-base !text-gray-700">
                    {reauthMessage}
                </Paragraph>
    
                <Text type="secondary" className="!text-sm">
                    You will be redirected to the login page for security reasons.
                </Text>
            </div>
        </Modal>
    )
}

export default ReauthenticationModal