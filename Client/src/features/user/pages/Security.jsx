import React, { useState, useEffect } from "react"
import { Button, Card, Divider, Typography } from "antd";
const { Text } = Typography

const Security = ({userData}) => {
  return (
    <Card title="Account Security" variant="borderless">
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Text strong>Two-Factor Authentication</Text>
                    <div>
                        <Text type="secondary">
                            {
                                userData?.twoFactorEnabled
                                ? "Enabled - Your account is protected with two-factor authentication"
                                : "Disabled - Enable for additional security"
                            }
                        </Text>
                     </div>
                </div>
                <Button
                    type="primary"
                    style={{
                        backgroundColor: userData?.twoFactorEnabled ? "#52c41a" : "#e5293e",
                        borderColor: userData?.twoFactorEnabled ? "#52c41a" : "#e5293e",
                    }}
                >
                    { userData?.twoFactorEnabled ? "Disable" : "Enable"}
                </Button>
            </div>
        </div>

        <Divider />

        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Text strong style={{ color: "#ff4d4f" }}>
                        Delete Account
                    </Text>
                    <div>
                        <Text type="secondary">Permanently delete your account and all associated data</Text>
                    </div>
                </div>
                <Button danger>Delete Account</Button>
            </div>
        </div>
    </Card>
  )
}

export default Security