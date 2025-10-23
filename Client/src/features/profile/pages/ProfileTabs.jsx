import React, { useEffect, useMemo } from 'react';
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
            <div className="flex items-center gap-2 px-1">
              <UserOutlined className="text-base" />
              <span className="hidden sm:inline">Personal Information</span>
              <span className="sm:hidden text-xs">Personal</span>
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
            <div className="flex items-center gap-2 px-1">
              <LockOutlined className="text-base" />
              <span className="hidden sm:inline">Change Password</span>
              <span className="sm:hidden text-xs">Password</span>
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
            <div className="flex items-center gap-2 px-1">
              <MailOutlined className="text-base" />
              <span className="hidden sm:inline">Email Settings</span>
              <span className="sm:hidden text-xs">Email</span>
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
            <div className="flex items-center gap-2 px-1">
              <SafetyOutlined className="text-base" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden text-xs">Security</span>
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
            <div className="flex items-center gap-2 px-1">
              <BellOutlined className="text-base" />
              <span className="hidden sm:inline">Reminders</span>
              <span className="sm:hidden text-xs">Alerts</span>
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
            <div className="flex items-center gap-2 px-1">
              <DeleteOutlined className="text-base text-red-500" />
              <span className="hidden sm:inline text-red-500">Danger Zone</span>
              <span className="sm:hidden text-xs text-red-500">Danger</span>
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