
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Routes, Route, Navigate} from 'react-router-dom';
import { Spin } from 'antd';
import Cookies from "js-cookie";
import { authStatusChecked, checkAuthStatus, selectAuth, selectUser } from './redux/slices/authSlice';
import Home from './features/home/pages/Home';
import MainLayout from './components/MainLayout';
import Profile from './features/user/pages/Profile';
import Admin from './features/admin/pages/Admin';
import Partner from './features/partner/pages/Partner';
import AuthTabs from './features/auth/pages/AuthTabs';
import MovieDetails from './features/movies/pages/MovieDetails';
import Booking from './features/movies/pages/SeatSelection';
import OrderHistory from './features/movies/pages/Bookings';
import ResetPassword from './features/auth/pages/ResetPassword';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({children}) => {
  const user = useSelector(selectUser);
  const {isAuthenticated, checkingAuth} = useSelector(selectAuth);

  if(checkingAuth) { 
    // return null;
    return (
      <div className='loader-container'>
          <Spin size="large" />
      </div>
    )
  }

  if(!isAuthenticated)
  {
    return <Navigate to="/" replace/>
  }
  
  return <MainLayout>{children}</MainLayout>;
}

// Public Route component (redirects to dashboard if authenticated)
const PublicRoute = ({children}) => {
  const {isAuthenticated, checkingAuth} = useSelector(selectAuth);

  if(checkingAuth) 
  {
    return (
      <div className='loader-container'>
          <Spin size="large" />
      </div>
    )
  }

  if(isAuthenticated)
  {
    return <Navigate to="/home" replace/>
  }
  return children;
}

function App() {
  const dispatch = useDispatch();
  
  // Check authentication status on initial load
  useEffect(() => {
    const token = Cookies.get("access_token");
    if(token)
    {
      dispatch(checkAuthStatus());
    }
    else 
    {
      // If no token, mark auth check as complete
      dispatch(authStatusChecked({ isAuthenticated: false, user: null, token: null }))
    }
    
  }, [dispatch]);
  
  return (
      <Routes>
        <Route path ="/home" element={<ProtectedRoute><Home /></ProtectedRoute>}/>
        <Route path="/my-profile/edit" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-profile/purchase-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/partner" element={<ProtectedRoute><Partner /></ProtectedRoute>} />
        <Route path="/movie/:id/:date" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
        <Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path ="/" element={<PublicRoute><AuthTabs /></PublicRoute>}/>
         <Route path ="/no-auth/reset-password" element={<ResetPassword />}/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}

export default App
