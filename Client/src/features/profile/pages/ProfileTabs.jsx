import React, { useEffect, memo, useMemo } from 'react';
import { Card, Spin, Tabs } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  DeleteOutlined,
  BellOutlined,
} from "@ant-design/icons"
import PersonalInfoTab from "./Personal_InfoTab"
import PasswordTab from "./PasswordTab"
import EmailTab from "./EmailTab"
import SecurityTab from "./SecurityTab";
import DangerZoneTab from "./DangerZoneTab"
import ReauthenticationModal from './ReauthenticationModal';
import EmailChangeModal from './EmailChangeModal';
import ReminderSettingsTab from './ReminderSettingsTab';

import { useProfile } from '../../../hooks/useProfile';

const ProfileTabs = () => {
    const { showEmailVerificationModal, clearErrors } = useProfile();

    useEffect(() => {
      // Cleanup errors when component unmounts
      return () => {
        clearErrors()
      }
  }, [clearErrors]);

    const tabItems = useMemo(
      () => [
        {
          key: "1",
          label: (
            <div className="tab-label">
              <UserOutlined className="tab-icon" />
                <span>Personal Information</span>
            </div>
          ),
          children:  (
            <React.Suspense fallback={<Spin size="large" />}>
              <PersonalInfoTab />
            </React.Suspense>
          )
        },
        {
          key: "2",
          label:  (
            <div className="tab-label">
              <LockOutlined className="tab-icon" />
              <span>Change Password</span>
            </div>
          ),
          children:  (
            <React.Suspense fallback={<Spin size="large" />}>
              <PasswordTab />
            </React.Suspense>
          )
        },
        {
          key: "3",
          label:  (
            <div className="tab-label">
              <MailOutlined className="tab-icon" />
              <span>Email Settings</span>
            </div>
          ),
          children:  (
            <React.Suspense fallback={<Spin size="large" />}>
              <EmailTab />
            </React.Suspense>
          )
        },
        {
          key: "4",
          label:  (
            <div className="tab-label">
              <SafetyOutlined className="tab-icon" />
              <span>Security</span>
            </div>
          ),
          children:  (
            <React.Suspense fallback={<Spin size="large" />}>
              <SecurityTab />
            </React.Suspense>
          )
        },
        {
          key: "5",
          label: (
            <div className="tab-label">
              <BellOutlined className="tab-icon" />
              <span>Reminders</span>
            </div>
          ),
          children:  (
            <React.Suspense fallback={<Spin size="large" />}>
              <ReminderSettingsTab />
            </React.Suspense>
          )
        },
        {
          key: "6",
          label:  (
            <div className="tab-label">
              <DeleteOutlined className="tab-icon danger" />
              <span>Danger Zone</span>
            </div>
          ),
          children:  (
            <React.Suspense fallback={<Spin size="large" />}>
              <DangerZoneTab/>
            </React.Suspense>
          )
        },
      ],
      []
    )

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