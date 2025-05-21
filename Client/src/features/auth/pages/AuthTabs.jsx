import React, { useEffect} from 'react';
import { Carousel, Image, Tabs } from 'antd'
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import cinemaBackground from "../../../assets/cinema-background.png";
import cinemaBackground_1 from "../../../assets/cinema-background-1.png"
import cinemaBackground_2 from "../../../assets/cinema-background-2.png"
import Logo from "../../../assets/bookmyshow_light.svg";
import { useDispatch, useSelector } from 'react-redux';
import { selectisAuthenticated } from '../../../redux/slices/authSlice';
import { selectActiveTab, setActiveTab } from '../../../redux/slices/uiSlice';

const AuthTabs = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectisAuthenticated);
    const activeTab = useSelector(selectActiveTab);
   
    // Check if user is already logged in
    useEffect(() => {
        if(isAuthenticated)
        {
            // Redirect to home page if already logged in
            navigate('/home', { replace: true });
        }        
    }, [isAuthenticated, navigate]);


    // Define tab items
    const items = [
        {
            key: "login",
            label: "Login",
            children: <Login />
        },
        {
            key: "signup",
            label: "Sign Up",
            children: <Register />
        }
    ]

  return (
    <div className="auth-container">
        <div className="auth-split-layout">
            <div className="auth-banner">
                <div className="auth-banner-content">
                    <div className="auth-logo">
                        {/* <PlaySquareOutlined className="logo-icon" /> */}
                        <img
                            src={Logo} 
                            alt="BookMyShow Logo" 
                            className="logo-icon"
                        />
                        {/* <h1>BookMyShow</h1> */}
                    </div>
                    <div className="auth-banner-text">
                        <h2>Your Entertainment Journey Starts Here</h2>
                        <p>Book tickets for movies, concerts, plays, sports, and more!</p>
                        <div className="auth-features">
                            <div className="feature-item">
                                <div className="feature-icon">🎬</div>
                                <div className="feature-text">Latest Movies</div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🎭</div>
                                <div className="feature-text">Live Events</div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🎟️</div>
                                <div className="feature-text">Exclusive Deals</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Carousel autoplay>
                            <Image
                                src={cinemaBackground}
                                alt="Entertainment collage - 1"
                                // height={300}
                                className="banner-image"
                            />
                            <Image
                                src={cinemaBackground_1}
                                alt="Entertainment collage - 2"
                                // height={300}
                                className="banner-image"
                            />
                            <Image
                                src={cinemaBackground_2}
                                alt="Entertainment collage - 3"
                                // height={300}
                                className="banner-image"
                            />
                        </Carousel>
                    </div>
                </div>
            </div>
            <div className="auth-form-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Welcome Back</h1>
                        <p>{activeTab === "login" ? "Login to continue to your account" : "Create a new account"}</p>
                    </div>
                    <Tabs 
                        centered 
                        className="auth-tabs" 
                        activeKey={activeTab}
                        onChange={(key) => dispatch(setActiveTab(key))}
                        items={items}
                    />  
                </div>
            </div>
        </div>
    </div>
  )
}

export default AuthTabs