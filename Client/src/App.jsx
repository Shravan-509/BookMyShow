import {Routes, Route} from 'react-router-dom';
import Home from './features/home/pages/Home';
import './App.css';
import Profile from './features/user/pages/Profile';
import Admin from './features/admin/pages/Admin';
import Partner from './features/partner/pages/Partner';
import ProtectedRoute from './components/ProtectedRoute';
import AuthTabs from './features/auth/pages/AuthTabs';
import { useDispatch } from 'react-redux';
import { fetchUser } from './redux/actions/authSlice';
import { useEffect } from 'react';

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);
  
  return (
    
      <Routes>
        <Route path ="/home" element={<ProtectedRoute><Home /></ProtectedRoute>}/>
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/partner" element={<ProtectedRoute><Partner /></ProtectedRoute>} />
        <Route path ="/" element={<AuthTabs />}/>
      </Routes>
  )
}

export default App
