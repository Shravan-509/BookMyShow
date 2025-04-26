import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import { useSelector } from 'react-redux';
import { Flex, Spin } from 'antd';
import Profile from './pages/Profile';
import Admin from './pages/Admin/Admin';
import Partner from './pages/Partner/Partner';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const {loading} = useSelector((state) => state.loader)
  return (
   <>
   {
    loading && (
      <div className='loader-container'>
        {/* <div className='loader'></div> */}
          <Flex align="center" gap="middle">
            <Spin size="large" />
          </Flex>
      </div>
      
    )
   }
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<ProtectedRoute><Home /></ProtectedRoute>}/>
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/partner" element={<ProtectedRoute><Partner /></ProtectedRoute>} />
        <Route path ="/login" element={<Login />}/>
        <Route path ="/register" element={<Register />}/>
      </Routes>
   </BrowserRouter>
   </>
  )
}

export default App
