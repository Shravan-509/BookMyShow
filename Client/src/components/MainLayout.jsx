import React, { useEffect, useState } from 'react';
import { Layout, Menu, Spin, theme, Button, Drawer, Divider } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { EditOutlined, HomeOutlined, LogoutOutlined, MenuOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from "js-cookie"
import { checkAuthStatus, selectAuthLoading} from '../redux/slices/authSlice';
import Logo from "../assets/bookmyshow_light.svg";
import {useAuth} from "../hooks/useAuth"


const MainLayout = ({ children}) => {
    const  {user, logout} = useAuth();
    // const dispatch = useDispatch();

    // useEffect(() => {
    //     const token = Cookies.get("access_token");
    //     if(token && !user)
    //     {
    //         dispatch(checkAuthStatus());
    //     }
    // }, [dispatch, user]);

    
    const loading = useSelector(selectAuthLoading);

    console.log(user);

    const [openDrawer, setOpenDrawer] = useState(false);

    const showDrawer = () => setOpenDrawer(true);
    const closeDrawer = () => setOpenDrawer(false);
   
    const navigate = useNavigate();

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

      const navItems = [
        {
          key: 'home',
          label: (
            <span 
                onClick={()=> { navigate("/home", {replace: true}) } }
            >
                Home
            </span>
          ),
          icon: <HomeOutlined />,
        },
        {
            key: 'roleProfile',
            label: (
                <span 
                    onClick={()=> { 
                       if(user.role === "admin")
                        {
                            navigate("/admin", { replace: true });
                        }
                        else if(user.role === "partner")
                        {
                                navigate("/partner", { replace: true });
                        }
                        else
                        {
                            navigate("/profile", { replace: true });
                        } 
                    }}
                >
                    {user?.role === "admin" && "Movie Management"}
                    {user?.role === "partner" && "Theatre Management"}
                    {user?.role === "user" && "My Bookings"}
                </span>
            ),
            icon: <ProfileOutlined/>,
        },
        {
            key: 'profile',
            label: `Hi, ${ user ? user.name: " "}`,
            icon: <UserOutlined/>
        }
          
      ];

      const drawerItems = [
        {
            key: '1',
            icon: <UserOutlined />,
            label: (
                <Link 
                    to="/profile"
                >
                    View Profile
                </Link>
            ),
            
        },
        {
            key: '2',
            icon: <EditOutlined />,
            label: (
                <Link 
                    to="/update"
                >
                    Update Profile
                </Link>
            ),
        },
        {
            type: 'divider',
        },
        {
            key: '3',
            label: (
                <Button type="primary" danger block 
                    onClick={logout} 
                    icon={<LogoutOutlined/>}
                    style={{ marginTop: '0.5rem' }}
                >
                    Logout
                </Button>
            )
        },
      ]
    
  return (
    <>
        {
            loading && (
            <div className='loader-container'>
                <Spin size="large" />
            </div>
            )
        }
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header style={{
                    background: '#1F2533', 
                    display: 'flex', 
                    alignItems: 'center', 
                    position: "sticky", 
                    zIndex: 1, 
                    top: 0,
                    padding: "0 24px"
                }}>
                <img 
                    src={Logo} 
                    alt="BookMyShow Logo" 
                    style={{ height: '40px', marginRight: '10px' }} 
                />
                {/* <Title level={3} style={{ marginTop: "10px", color: "white"}}>
                    BookMyShow
                </Title> */}
                <Menu 
                    theme="dark" 
                    mode="horizontal" 
                    items={navItems} 
                    style={{ background: '#1F2533', flex: 1, minWidth: 0, justifyContent: "flex-end"}} 
                    defaultSelectedKeys={['home']}
                />
                
                <Button 
                    icon={<MenuOutlined />} 
                    type="text" 
                    style={{ color: "white", marginLeft: "auto" }} 
                    onClick={showDrawer}
                />
            </Header>
            <Content style={{ flex: 1, padding: 24, borderRadius: borderRadiusLG }}>
                {children}
            </Content>
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
                    <Link 
                        to="/"
                    >
                        <img
                            src={Logo} 
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
                    The content and images used on this site are copyright protected and
                    copyrights vest with the respective owners. The usage of the content and
                    images on this website is intended to promote the works and no endorsement
                    of the artist shall be implied. Unauthorized use is prohibited and
                    punishable by law.
                </div>
            </Footer>

            <Drawer
                title={`Hey! ${ user ? user.name: " "}`}
                placement="right"
                onClose={closeDrawer}
                open={openDrawer}
                style={{ background: '#f5f5f5'}}
                >
                    {/* <Button type="link" block>View Profile</Button>
                    <Button type="link" block>Update Info</Button>
                    <Divider />
                    <Button type="primary" danger block onClick={() => handleLogout()}>Logout</Button> */}
                <Menu
                    mode="vertical"
                    style={{
                        background: '#f5f5f5', 
                        borderRight: 0,
                    }}
                    items={drawerItems}
                />
            </Drawer>
        </Layout>
    </>
    
  )
}

export default MainLayout