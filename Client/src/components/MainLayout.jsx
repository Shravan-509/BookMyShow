import { useState, useMemo, memo, useCallback } from 'react'
import { Layout, Menu, Spin, theme, Button, Drawer, Divider, Typography, Tooltip } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { 
    HomeOutlined, 
    LogoutOutlined, 
    MenuOutlined, 
    ProfileOutlined, 
    ShoppingOutlined, 
    UserOutlined,
    DashboardOutlined,
    BarChartOutlined
} from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAuthLoading } from '../redux/slices/authSlice'
import Logo from "../assets/bookmyshow_light.svg"
import {useAuth} from "../hooks/useAuth"
const {Text} = Typography

const LoadingSpinner = memo(() => (
    <div className='loader-container'>
        <Spin size="large" />
    </div>     
))

LoadingSpinner.displayName = "LoadingSpinner"

const LogoComponent = memo(() => (
    <Link to="/home">
        <img 
            src={Logo || "/placeholder.svg"} 
            alt="BookMyShow Logo" 
            style={{ height: '40px', marginRight: '10px' }} 
        />
    </Link>
))

LogoComponent.displayName = "LogoComponent"

const FooterComponent = memo(() => (
    <Footer 
        style={{ 
            textAlign: 'center',
            background: 'rgb(51, 51, 56)',
            color: 'white',
            padding: '40px 20px'
        }}
    >
        <Divider 
            orientation="center" 
            style={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                marginBottom: '24px',
            }}
        >
            <Link to="/">
                <img
                    src={Logo || "/placeholder.svg"}
                    alt="BookMyShow Logo" 
                    style={{ height: '40px' }}
                />
            </Link>
        </Divider>
        <div 
            style={{ 
                maxWidth: '800px', 
                margin: '0 auto', 
                padding: '30px',
                fontSize: '11px',
                color: 'rgb(102, 102, 102)',
                textAlign: 'center'
            }}
        >
            Copyright {new Date().getFullYear()} © Shravan Kumar Atti. All Rights Reserved.
            <br />
            The content and images used on this site are copyright protected and copyrights vest with the 
            respective owners. 
            The usage of the content and images on this website is intended to promote the works and no 
            endorsement of the artist shall be implied. 
            Unauthorized use is prohibited and punishable by law.
        </div>
    </Footer>
))

FooterComponent.displayName = "FooterComponent"

const MainLayout = memo(({ children }) => {
    const { user, logout } = useAuth()    
    const loading = useSelector(selectAuthLoading)
    const [openDrawer, setOpenDrawer] = useState(false)
    const location = useLocation()

    const showDrawer = useCallback(() => setOpenDrawer(true), [])
    const closeDrawer = useCallback(() => setOpenDrawer(false), [])
   
    const navigate = useNavigate()

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

    // Utility: Truncate name
    const truncate = useCallback((str, maxLength = 12) => 
    {
        if (!str) return ""
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str
    }, [])

    const handleHomeClick = useCallback(() => {
        navigate("/home", { replace: true })
    }, [navigate])

    const handleRoleProfileClick = useCallback(() => {
        if(user?.role === "admin")
        {
            navigate("/admin", { replace: true })
        }
        else if(user?.role === "partner")
        {
            navigate("/partner", { replace: true })
        }
        else
        {
           navigate("/my-profile/purchase-history", { replace: true })
        }
    }, [navigate, user?.role])

    const navItems = useMemo(() => {
        const items =
        [
            {
                key: 'home',
                label: <span onClick={handleHomeClick}>Home</span>,
                icon: <HomeOutlined />,
            },
        ]

        // Role-specific navigation
        if (user?.role === "admin") 
        {
            items.push({
                key: "roleProfile",
                label: <span onClick={handleRoleProfileClick}>Admin Dashboard</span>,
                icon: <DashboardOutlined />,
            })
        } 
        else if (user?.role === "partner") 
        {
            items.push({
                key: "roleProfile",
                label: <span onClick={handleRoleProfileClick}>Partner Dashboard</span>,
                icon: <BarChartOutlined />,
            })
        } 
        else 
        {
            items.push({
                key: "roleProfile",
                label: <span onClick={handleRoleProfileClick}>My Bookings</span>,
                icon: <ShoppingOutlined />,
            })
        }

        items.push({
            key: "profile",
            label: (
                <Tooltip title={user?.name || ""} placement="bottom">
                <span
                    style={{
                        cursor: "default",
                        color: "inherit",
                        display: "inline-block",
                        maxWidth: 120,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        verticalAlign: "middle",
                    }}
                >
                    Hi, {truncate(user?.name)}
                </span>
                </Tooltip>
            ),
            icon: <UserOutlined />,
        })
    
        return items
    }, [user?.name, user?.role, handleHomeClick, handleRoleProfileClick, truncate])

    const drawerItems = useMemo(() => {
        const items = [
            {
                key: '1',
                icon: <UserOutlined />,
                label: (
                    <Link to="/my-profile/edit" onClick={closeDrawer}>
                        Edit Profile
                    </Link>
                ),
                
            }
        ]

        if (user?.role === "user") {
            items.push({
                key: "2",
                icon: <ShoppingOutlined />,
                label: (
                <Link to="/my-profile/purchase-history" onClick={closeDrawer}>
                    Your Orders
                </Link>
                ),
            })
        }
        
        if (user?.role === "admin") {
            items.push({
                key: "3",
                icon: <DashboardOutlined />,
                label: (
                <Link to="/admin" onClick={closeDrawer}>
                    Admin Dashboard
                </Link>
                ),
            })
        }
        if (user?.role === "partner") {
            items.push({
                key: "4",
                icon: <BarChartOutlined />,
                label: (
                <Link to="/partner" onClick={closeDrawer}>
                    Partner Dashboard
                </Link>
                ),
            })
        }

        items.push({
            type: "divider",
        })

        return items

    },[user?.role, closeDrawer])

    const selectedKey = useMemo(() => {
        if (location.pathname === "/home") 
            return "home"
        if (
        location.pathname === "/admin" ||
        location.pathname === "/partner" ||
        location.pathname.includes("/my-profile/purchase-history")
        )
            return "roleProfile"
        return "home"
    }, [location.pathname])

    if(loading)
    {
        return <LoadingSpinner />
    }
    
  return (
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header 
                style={{
                    background: '#1F2533', 
                    display: 'flex', 
                    alignItems: 'center', 
                    position: "sticky", 
                    zIndex: 1, 
                    top: 0,
                    padding: "0 24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}
            >
                <LogoComponent />
                <Menu 
                    theme="dark" 
                    mode="horizontal" 
                    items={navItems} 
                    className='custom-nav-menu'
                    selectedKeys={[selectedKey]}
                    style={{ flex: 1, minWidth: 0 }}
                />
                <Button 
                    icon={<MenuOutlined />} 
                    type="text" 
                    style={{ color: "white", marginLeft: "auto" }} 
                    onClick={showDrawer}
                />
            </Header>
            <Content style={{ flex: 1, padding: 24, borderRadius: borderRadiusLG, background: "#f5f5f5" }}>
                {children}
            </Content>
            
           <FooterComponent />

            <Drawer
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <UserOutlined style={{ fontSize: "20px", color: "#f84464" }} />
                        <span>Hey! {user ? user.name : " "}</span>
                    </div>
                }
                placement="right"
                onClose={closeDrawer}
                open={openDrawer}
                style={{ background: '#f5f5f5' }}
                >
                <Menu
                    mode="vertical"
                    style={{
                        background: '#f5f5f5', 
                        borderRight: 0,
                    }}
                    items={drawerItems}
                />
                <Button 
                    type="primary"
                    block
                    className="bg-[#f84464]! hover:bg-[#dc3558]! text-white! border-none!"
                    onClick={logout} 
                    icon={<LogoutOutlined/>}
                    style={{ marginTop: '0.5rem' }}
                >
                    Logout
                </Button>
            </Drawer>
        </Layout> 
  )
})

MainLayout.displayName = "MainLayout"

export default MainLayout