import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';


const Home = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <>
    <div>Home</div>
    <div>Hello, {user?.name}</div>
    <div>Email : {user?.email}</div>
   
    </>

  )
}

export default Home