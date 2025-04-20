import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { UserInfo } from '../api/user';
import { Button, message } from 'antd';

const Home = () => {
  const [userInfo, setUserInfo] = useState();
  const navigate = useNavigate();

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
    try {
      const response = await UserInfo();
      if(response?.success)
      {
        setUserInfo(response.data);
      }      

    } catch (error) {
      message.error(error);
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  }
  
  return (
    <>
    <div>Home</div>
    <div>Hello, {userInfo?.name}</div>
    <div>Email : {userInfo?.email}</div>
    <Button onClick={logout}>Logout</Button>
    </>

  )
}

export default Home