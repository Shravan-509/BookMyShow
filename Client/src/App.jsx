
import { useEffect, lazy, Suspense, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Cookies from "js-cookie";
import { authStatusChecked, checkAuthStatus, selectAuth } from './redux/slices/authSlice';
import MainLayout from './components/MainLayout';
import './App.css';

const Home = lazy(() => import(/* webpackChunkName: "home" */ './features/home/pages/Home'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ './features/profile/pages/Profile'));
const Admin = lazy(() => import(/* webpackChunkName: "admin" */ './features/admin/pages/Admin'));
const Partner = lazy(() => import(/* webpackChunkName: "partner" */ './features/partner/pages/Partner'));
const AuthTabs = lazy(() => import(/* webpackChunkName: "auth" */ './features/auth/pages/AuthTabs'));
const MovieDetails = lazy(() => import(/* webpackChunkName: "movie-details" */ './features/movies/pages/MovieDetails'));
const Booking = lazy(() => import(/* webpackChunkName: "booking" */ './features/movies/pages/SeatSelection'));
const OrderHistory = lazy(() => import(/* webpackChunkName: "order-history" */ './features/movies/pages/Bookings'));
const ResetPassword = lazy(() => import(/* webpackChunkName: "reset-password" */ './features/auth/pages/ResetPassword'));

const LoadingFallback = memo(() => (
  <div className='loader-container'
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "50vh",
      width: "100%",
      position: "relative",
    }}
  >
      <Spin size="large" />
  </div>
))

LoadingFallback.displayName = "LoadingFallback"

// Protected Route Component
const ProtectedRoute = memo(({children}) => {
  const { isAuthenticated, checkingAuth } = useSelector(selectAuth);

  if(checkingAuth) 
  { 
    return <LoadingFallback/>
  }

  if(!isAuthenticated)
  {
    return <Navigate to="/" replace/>
  }
  
  return (
    <MainLayout>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </MainLayout>
  );
})

ProtectedRoute.displayName = "ProtectedRoute"

// Public Route component (redirects to dashboard if authenticated)
const PublicRoute = memo(({ children }) => {
  const { isAuthenticated, checkingAuth } = useSelector(selectAuth);

  if(checkingAuth) 
  {
    return <LoadingFallback/>
  }

  if(isAuthenticated)
  {
    return <Navigate to="/home" replace/>
  }
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
})

PublicRoute.displayName = "PublicRoute"

// User Route component (redirects to home if Admin/Partner)
const UserRoute = memo(({ children }) => {
  const { user } = useSelector(selectAuth);
  
  if (!user || user.role !== "user") 
  {
    return <Navigate to="/home" replace />;
  }

  return children;
})

UserRoute.displayName = "UserRoute"

function App() {
  const dispatch = useDispatch();
  
  // Check authentication status on initial load
  useEffect(() => {
    // Preload Home component for faster navigation
    import("./features/home/pages/Home")

    const token = Cookies.get("access_token");
    if(token)
    {
      dispatch(checkAuthStatus());

      // Preload user-specific components if authenticated
      import("./features/movies/pages/MovieDetails")
    }
    else 
    {
      // If no token, mark auth check as complete
      dispatch(authStatusChecked({ isAuthenticated: false, user: null, token: null }))
    }
    
  }, [dispatch]);
  
  return (
      <Routes>
        <Route 
          path ="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/my-profile/edit" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/partner" 
          element={
            <ProtectedRoute>
              <Partner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/movie/:id/:date" 
          element={
            <ProtectedRoute>
              <UserRoute>
                <MovieDetails />
              </UserRoute>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/booking/:id" 
          element={
            <ProtectedRoute>
              <UserRoute>
                <Booking />
              </UserRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-profile/purchase-history" 
          element={
            <ProtectedRoute>
              <UserRoute>
                <OrderHistory />
              </UserRoute>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path ="/" 
          element={
            <PublicRoute>
              <AuthTabs />
            </PublicRoute>
          }
        />
        <Route 
          path ="/no-auth/reset-password" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ResetPassword />
            </Suspense>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}

export default App
