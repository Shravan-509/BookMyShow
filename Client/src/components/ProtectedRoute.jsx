import React, { useEffect } from 'react';
import { Layout, Menu, message } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { EditOutlined, HomeOutlined, LogoutOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/loaderSlice';
import { setUser } from '../redux/userSlice';
import { UserInfo } from '../api/user';


const ProtectedRoute = ({ children}) => {
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();
   
    useEffect(() => {
        if(localStorage.getItem("access_token")){
          getValidUser();
        }
        else
        {
          navigate("/login");
        }
      }, []);
    
      const getValidUser = async () => {
        try 
        {
            dispatch(showLoading());
            const response = await UserInfo();
            if(response?.success)
            {
                dispatch(setUser(response?.data))
            }
            else{
                message.warning(response?.message)
                localStorage.removeItem("access_token");
            }      
        
        } catch (error) {
          message.error(error);
        } finally{
            dispatch(hideLoading());
        }
      }
      const navItems = [
        {
          key: 'home',
          label: (
            <span 
                onClick={()=> { navigate("/", {replace: true}) } }
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
                       if(user.role === "admin"){
                            navigate("/admin");
                       }
                       else if(user.role === "partner"){
                            navigate("/partner");
                       }
                       else{
                        navigate("/profile");
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
            icon: <UserOutlined/>,
            children: [
                {
                    key: 'Update Profile',
                    label: (
                        <Link 
                            to="/update"
                        >
                            Update Profile
                        </Link>
                    ),
                    icon: <EditOutlined/>,
                },
                {
                    key: 'logout',
                    label: (
                        <Link 
                            to="/login"
                            onClick={()=> { localStorage.removeItem("access_token"); }}
                        >
                            Logout
                        </Link>
                    ),
                    icon: <LogoutOutlined/>,
                }
            ]
        }
          
      ];
  return (
    <>
        <Layout>
            <Header 
                className='d-flex justify-content-between'
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    width: "100%",
                    alignItems: "center"
                }}
            >
                <h3 className='text-white m-0' style={{ color: "white"}}>
                    BookMyShow
                </h3>
                <Menu theme="dark" mode="horizontal" items={navItems}></Menu>
            </Header>
            <Content>
                {children}
            </Content>
            <Footer style={{ 
                textAlign: 'center',
                background: '#001529',
                color: 'white',
                position: 'absolute',
                bottom: 0,
                zIndex: 1,
                width: "100%",
                }}
            >
                BookMyShow ©{new Date().getFullYear()} Created by Shravan Kumar Atti
            </Footer>

        </Layout>
    </>
    
  )
}

export default ProtectedRoute