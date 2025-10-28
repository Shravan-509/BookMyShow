import React from "react"
import { Alert, Card, Divider, Switch, Typography } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, SafetyOutlined } from "@ant-design/icons";
import { useProfile } from "../../../hooks/useProfile";

const {Title, Text, Paragraph} = Typography;

const Security = () => {
      const { profile, securityLoading, securityError, toggle2FA, clearErrors } = useProfile();

      const handle2FAToggle = () => {
        toggle2FA()
      }
  return (
    <Card 
        title={
        <Title level={4} className="!mb-0 !text-[#f84464]">
          Security Settings
        </Title>
      }
      className="!rounded-xl"
      styles={{
            body: {
                padding: '24px'
            }
        }}
    >
         <Paragraph className="text-gray-500 mb-6 text-sm">
            Manage your account's security options to protect your information.
        </Paragraph>

        {
            securityError && (
                <Alert
                    message="Security Update Failed"
                    description={securityError}
                    type="error"
                    showIcon
                    closable
                    onClose={clearErrors}
                    className="mb-4!"
                />
        )}

        {/* Two-Factor Authentication */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                     <Title level={5} className="mb-1!">
                        <SafetyOutlined className="!mr-2" />
                        Two-Factor Authentication
                    </Title>
                    <Text type="secondary">
                        {
                            profile?.twoFactorEnabled
                            ? "Your account is protected with 2FA."
                            : "Enable 2FA for enhanced account security."
                        }
                    </Text>
                </div>

                <Switch
                    checked={profile?.twoFactorEnabled}
                    onChange={handle2FAToggle}
                    loading={securityLoading}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                />
            </div>

            <div
                className={`p-3 rounded-md ${
                            profile?.twoFactorEnabled
                            ? "bg-[#f6ffed] border border-[#b7eb8f] text-[#389e0d]"
                            : "bg-[#fff7e6] border border-[#ffd591] text-[#d46b08]"
                        }`}
            >
                {
                    profile?.twoFactorEnabled ? (
                        <>
                            <CheckCircleOutlined className="!mr-2" />
                            Two-factor authentication is enabled
                        </>
                    ) : (
                        <>
                            <ExclamationCircleOutlined className="!mr-2" />
                            Two-factor authentication is disabled
                        </>
                    )}
            </div>
        </div>

        <Divider />

        {/* Account Status */}
        <div className="mb-8">
            <Title level={5} className="mb-4!">
                Account Status
            </Title>

            <div className="mb-3">
                <Text strong>Email Verification: </Text>
                {
                    profile?.emailVerified ? (
                        <Text className="!text-[#52c41a]">
                            <CheckCircleOutlined className="!mr-1" />
                            Verified
                        </Text>
                    ) : (
                    <Text className="!text-[#ff4d4f]">
                        <ExclamationCircleOutlined className="!mr-1" />
                        Not Verified
                    </Text>
                )}
            </div>

            <div className="mb-3">
                <Text strong>Account Created: </Text>
                <Text>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}</Text>
            </div>

            <div className="mb-3">
                <Text strong>Last Updated: </Text>
                <Text>{profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "Never"}</Text>
            </div>
        </div>

        <Divider />

        {/* Security Recommendations */}
        <div>
            <Title level={5} className="mb-4!">
                Security Recommendations
            </Title>

           <div className="p-4 bg-[#f6f8fa] rounded-md">
                <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li className="mb-2">
                        { profile?.twoFactorEnabled ? "✅" : "❌"} Enable two-factor authentication
                    </li>
                    <li className="mb-2">
                        {profile?.emailVerified ? "✅" : "❌"} Verify your email address
                    </li>
                    <li className="mb-2">
                        🔄 Change your password regularly
                    </li>
                    <li className="mb-2">
                        🔒 Use a strong, unique password
                    </li>
                    <li>👀 Monitor your account activity regularly</li>
                </ul>
            </div>
        </div>
    </Card>
  )
}

export default Security