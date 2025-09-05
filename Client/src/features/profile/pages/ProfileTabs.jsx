import React, { useEffect } from 'react';
import { Alert, Card, Spin, Tabs } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import PersonalInfoTab from "./Personal_InfoTab"
import PasswordTab from "./PasswordTab"
import EmailTab from "./EmailTab"
import SecurityTab from "./SecurityTab";
import  DangerZoneTab from "./DangerZoneTab"
import { useProfile } from '../../../hooks/useProfile';
import ReauthenticationModal from './ReauthenticationModal';

const ProfileTabs = () => {
    const { showEmailVerificationModal, clearErrors } = useProfile();

    useEffect(() => {
      // Cleanup errors when component unmounts
      return () => {
        clearErrors()
      }
  }, [clearErrors]);

    const tabItems = [
    {
      key: "1",
      label:  <div className="tab-label">
                <UserOutlined className="tab-icon" />
                  <span>Personal Information</span>
              </div>,
      children:  <PersonalInfoTab />
    },
    {
      key: "2",
      label:  <div className="tab-label">
                <LockOutlined className="tab-icon" />
                <span>Change Password</span>
              </div>,
      children: <PasswordTab />
    },
    {
      key: "3",
      label:  <div className="tab-label">
                <MailOutlined className="tab-icon" />
                <span>Email Settings</span>
              </div>,
      children: <EmailTab/>
    },
    {
      key: "4",
      label:  <div className="tab-label">
                <SafetyOutlined className="tab-icon" />
                <span>Security</span>
              </div>,
      children: <SecurityTab/>
    },
    {
      key: "5",
      label:  <div className="tab-label">
                <DeleteOutlined className="tab-icon danger" />
                <span>Danger Zone</span>
              </div>,
      children: <DangerZoneTab/>
    },

  ]

  return (
  <div className="bookmyshow-tabs-container">
    <Card className="tab-card">
        <Tabs
          defaultActiveKey="1" 
          tabPosition={"top"} 
          items={tabItems}
          tabBarGutter={24}
          className="bookmyshow-tabs"
          animated={{ inkBar: true, tabPane: true }}
          type="card"
        >
        </Tabs>
    </Card>
    {/* Email Change Verification Modal */}
      { showEmailVerificationModal && <EmailChangeModal />}
       <ReauthenticationModal />
   </div>
  )
}

export default ProfileTabs