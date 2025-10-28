import React, { useEffect, memo, useMemo } from "react"
import { Layout, Typography, Card, Spin, Avatar, Alert } from "antd"
import { UserOutlined } from "@ant-design/icons"

import { useAuth } from "../../../hooks/useAuth"
const ProfileTabs = React.lazy(() => import("./ProfileTabs"))
import { useProfile } from "../../../hooks/useProfile"

const { Content } = Layout
const { Title, Text } = Typography

const Profile = memo(() => {
  const { user } = useAuth();    
  const { profile, loading, error, fetchProfile, resetProfile } = useProfile()

  const displayProfile = useMemo(() => profile || user, [profile, user])

  const memberSinceDate = useMemo(() => {
    return displayProfile?.createdAt ? new Date(displayProfile.createdAt).toLocaleDateString() : "Unknown"
  }, [displayProfile?.createdAt])

  useEffect(() => {
    if(!profile && !loading)
    {
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
  
  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Content style={{ margin: "16px auto", padding: "16px", maxWidth: 1024, width: "100%" }}>
        <Title level={3} className="text-[#f84464]! mb-4! text-xl! sm:text-2xl! px-2">
            My Profile
        </Title>
      
        <Card className="rounded-xl! mb-4! shadow-sm!">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
             <Avatar 
                size={{ xs: 64, sm: 80, md: 80 }} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: "#e5293e", flexShrink: 0 }} 
                src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" 
              />
            <div className="flex-1 min-w-0">
              <Title level={4} className="mb-1! text-lg! sm:text-xl!">
                {displayProfile?.name || "Loading..."}
              </Title>
              <Text type="secondary" className="block text-sm sm:text-base break-all">
                {displayProfile?.email || "Loading..."}
              </Text>
              <Text type="secondary" className="text-xs sm:text-sm block mt-1">
                Member since {memberSinceDate}
              </Text>
            </div>
          </div>
        </Card>

        <div className="profile-tabs-container">
          <React.Suspense 
            fallback={
            <Card className="rounded-xl!">
              <div className="flex justify-center py-8">
                <Spin size="large" />
              </div>
            </Card>
            }
          >
            <ProfileTabs/>
          </React.Suspense>
        </div>
      </Content>
    </Layout>
  )
})

Profile.displayName = "Profile"
export default Profile