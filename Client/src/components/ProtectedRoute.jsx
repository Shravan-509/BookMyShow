import React, { useEffect, useState } from 'react';
import { Layout, Menu, message, Spin, theme, Button, Drawer, Divider } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { CloseOutlined, EditOutlined, HomeOutlined, LogoutOutlined, MenuOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slices/loaderSlice';
import { logout } from '../redux/slices/authSlice';
import { UserInfo, UserLogout } from '../api/user';
import Logo from "../assets/bookmyshow_light.svg";
import { fetchUser } from '../redux/actions/authSlice';


const ProtectedRoute = ({ children}) => {
    const { user, loading } = useSelector((state) => state.auth);

    const [openDrawer, setOpenDrawer] = useState(false);

    const showDrawer = () => setOpenDrawer(true);
    const closeDrawer = () => setOpenDrawer(false);
   
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        token: { colorBgContainer, borderRadiusLG },
      } = theme.useToken();
   
    useEffect(() => {
        if(!user)
        {
            dispatch(fetchUser()) // Fetch user details from API
            .unwrap()
            .catch(() => {
                navigate("/", { replace: true }); // If authentication fails, redirect to login
            });
        }
        
        
      }, [user, dispatch, navigate]);
    
    //   const getValidUser = async () => {
    //     try 
    //     {
    //         dispatch(showLoading());
    //         const response = await UserInfo();
    //         if(response?.success)
    //         {
    //             // dispatch(setUser(response?.data))
    //             message.success(response?.message);
    //             navigate("/home" , { replace: true });
    //         }
    //         else
    //         {
    //             dispatch(logout());
    //             message.warning(response?.message)
    //             navigate("/" , { replace: true });
    //         }      
        
    //     } catch (error) {
    //       message.error(error);
    //       dispatch(logout());
    //       navigate("/" , { replace: true });
    //     } finally{
    //         dispatch(hideLoading());
    //     }
    //   }

      const handleLogout = async () => {
        try {
            dispatch(showLoading());
            const res = await UserLogout();
            if(res?.success)
            {
                message.success(res.message);
                dispatch(logout());
                navigate("/" , { replace: true });
            }
            else{
                message.warning(res?.response.data.message);
            }      
        } catch (error) {
            message.error(error);
        }finally{
            dispatch(hideLoading());
        }
      }
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
                       if(user.data.role === "admin"){
                            navigate("/admin", { replace: true });
                       }
                       else if(user.data.role === "partner"){
                            navigate("/partner", { replace: true });
                       }
                       else{
                        navigate("/profile", { replace: true });
                       } 
                    }}
                >
                    {user?.data.role === "admin" && "Movie Management"}
                    {user?.data.role === "partner" && "Theatre Management"}
                    {user?.data.role === "user" && "My Bookings"}
                </span>
            ),
            icon: <ProfileOutlined/>,
        },
        {
            key: 'profile',
            label: `Hi, ${ user ? user.data.name: " "}`,
            icon: <UserOutlined/>
        }
          
      ];

      const drawerItems = [
        {
            key: '1',
            icon: <UserOutlined />,
            label: (
                <Link 
                    to="/view"
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
                    onClick={handleLogout} 
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
            <Footer style={{ 
                textAlign: 'center',
                background: '#1F2533',
                color: 'white'
                }}
            >
                BookMyShow ©{new Date().getFullYear()} Created by Shravan Kumar Atti
            </Footer>

            <Drawer
                title={`Hey! ${ user ? user.data.name: " "}`}
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

export default ProtectedRoute