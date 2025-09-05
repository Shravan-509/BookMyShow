import React, { useEffect } from "react"
import { Layout, Typography, Card, Tabs, Spin, Avatar, Alert } from "antd"
import {UserOutlined} from "@ant-design/icons"

import { useAuth } from "../../../hooks/useAuth"
import ProfileTabs from "./ProfileTabs"
import { useProfile } from "../../../hooks/useProfile"

const { Content } = Layout
const { Title, Text } = Typography

const Profile = () => {
  const { user } = useAuth();    
  const {profile, loading, error, fetchProfile, resetProfile} = useProfile()

  useEffect(() => {
    if(!profile && !loading){
      fetchProfile();
    }
  }, [profile, loading, fetchProfile]);

   if (loading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <Alert 
        message="Error Loading Profile" 
        description={error} 
        type="error" 
        showIcon 
        style={{ margin: "20px 0" }} 
      />
    )
  }

  const displayProfile =  profile || user;
  
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ margin: "32px auto", padding: "24px", maxWidth: 1024 }}>
        <Title level={3} className="!text-[#f84464] !mb-6">
              My Profile
        </Title>
      
        <Card className="!rounded-xl !mb-6">
          <div className="flex items-center gap-5">
             <Avatar 
              size={80} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: "#e5293e" }} 
              src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" 
            />
            <div>
              <Title level={4} className="!mb-1">
                {displayProfile?.name || "Loading..."}
              </Title>
              <Text type="secondary" className="block text-base">
                {displayProfile?.email || "Loading..."}
              </Text>
              <Text type="secondary" className="text-sm block mt-1">
                Member since {" "}
                { 
                  displayProfile?.createdAt 
                  ? new Date(displayProfile.createdAt).toLocaleDateString() 
                  : "Unknown"
                }
              </Text>
            </div>
          </div>
        </Card>
                
        <ProfileTabs/>

      </Content>
  </Layout>
  )
}

export default Profile