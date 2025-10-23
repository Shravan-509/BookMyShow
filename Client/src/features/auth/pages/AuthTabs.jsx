import React, { useEffect, memo, useMemo, useCallback} from 'react';
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

const CarouselComponent = memo(() => (
    <Carousel autoplay>
        <Image
            src={cinemaBackground || "/placeholder.svg"}
            alt="Entertainment collage - 1"
            className="banner-image"
            loading='lazy'
        />
        <Image
            src={cinemaBackground_1 || "/placeholder.svg"}
            alt="Entertainment collage - 2"
            className="banner-image"
            loading='lazy'
        />
        <Image
            src={cinemaBackground_2 || "/placeholder.svg"}
            alt="Entertainment collage - 3"
            className="banner-image"
            loading='lazy'
        />
    </Carousel>
))

CarouselComponent.displayName = "CarouselComponent"

const BannerContent = memo(() => (
    <div className="auth-banner-content">
        <div className="auth-logo">
            <img
                src={Logo || "/placeholder.svg"} 
                alt="BookMyShow Logo" 
                className="logo-icon"
            />
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
            <CarouselComponent />
        </div>
    </div>
))

BannerContent.displayName = "BannerContent"


const AuthTabs = memo(() => {
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

    const handleTabChange = useCallback(
        (key) => {
            dispatch(setActiveTab(key))
        },
        [dispatch]
    )

    // Define tab items
    const items = useMemo(
        () => [
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
            ],
            [],
    )

    const headerContent = useMemo(
        () => ({
            title : "Welcome Back",
            description : activeTab === "login" ? "Login to continue to your account" : "Create a new account",
        }),
        [activeTab],
    )

  return (
    <div className="auth-container">
        <div className="auth-split-layout">
            <div className="auth-banner">
               <BannerContent />
            </div>
            <div className="auth-form-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>{headerContent.title}</h1>
                        <p>{headerContent.description}</p>
                    </div>
                    <Tabs 
                        centered 
                        className="auth-tabs" 
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        items={items}
                    />  
                </div>
            </div>
        </div>
    </div>
  )
})

AuthTabs.displayName = "AuthTabs"

export default AuthTabs