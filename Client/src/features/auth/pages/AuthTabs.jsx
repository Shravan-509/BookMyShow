import { message, Tabs } from 'antd'
import React, { useEffect, useState } from 'react'
import Login from './Login';
import Register from './Register';
import { useNavigate } from 'react-router-dom';
import { UserInfo } from '../../../api/user';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice';
import { logout } from '../../../redux/slices/authSlice';

const AuthTabs = () => {
    const [activeTab, setActiveTab] = useState("login");
    const [verificationEmail, setVerificationEmail] = useState("");
    const [tempUserId, setTempUserId] = useState(null);
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [countDown, setCountDown] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
   const { user, loading } = useSelector((state) => state.auth);

    // Check if user is already logged in
    useEffect(() => {
        if(user)
        {
         navigate('/home', { replace: true });
        }
        else
        {
            // getValidUser();
            dispatch(logout());
            navigate("/" , { replace: true });
        }
        
    }, []);
        
    const getValidUser = async () => {
        try 
        {
            dispatch(showLoading());
            const res = await UserInfo();
            if(res?.success)
            {
                dispatch(setUser(res?.data))
                navigate('/home', { replace: true });
            }
            else
            {
                dispatch(clearUser());
                navigate("/" , { replace: true });
            }      
        
        } catch (error) {
            dispatch(clearUser());
            message.error('Session expired. Please login again.');
            navigate("/" , { replace: true });
        } finally{
            dispatch(hideLoading());
        }
    }

    // Handle countDown for resend buttons
    useEffect(() => {
        let timer
        if (countDown > 0) 
        {
            timer = setTimeout(() => setCountDown(countDown - 1), 1000)
        } 
        else 
        {
            setResendDisabled(false)
        }
        
        return () => clearTimeout(timer)
    }, [countDown]);

    // Define tab items
    const items = [
        {
            key: "login",
            label: "Login",
            children: <Login
                        activeTab={activeTab}
                        countDown= {countDown}
                        setCountDown= {setCountDown}
                        resendDisabled= {resendDisabled}
                        setResendDisabled= {setResendDisabled}
                        verificationEmail={verificationEmail}
                        setVerificationEmail={setVerificationEmail}
                        tempUserId={tempUserId}
                        setTempUserId={setTempUserId}
                        showEmailVerificationModal= {showEmailVerificationModal}
                        setShowEmailVerificationModal={setShowEmailVerificationModal}
                    />
        },
        {
            key: "signup",
            label: "Sign Up",
            children: <Register 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab}
                        countDown= {countDown}
                        setCountDown= {setCountDown}
                        resendDisabled= {resendDisabled}
                        setResendDisabled= {setResendDisabled}
                        verificationEmail={verificationEmail}
                        setVerificationEmail={setVerificationEmail}
                        tempUserId={tempUserId}
                        setTempUserId={setTempUserId}
                        showEmailVerificationModal = {showEmailVerificationModal}
                        setShowEmailVerificationModal= {setShowEmailVerificationModal}
                        />
        }
    ]
  return (
    <div className="auth-container">
        <div className="auth-card">
            <div className="auth-header">
                <h1>Welcome to BookMyShow</h1>
                <p>Login or Sign Up to continue</p>
            </div>
            <Tabs 
                centered 
                className="auth-tabs" 
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                items={items}
            />  
        </div>
    </div>
  )
}

export default AuthTabs