import React from 'react';
import { Tabs, Typography } from 'antd';
import TheatreList from './TheatreList';

const { Title } = Typography;

const Partner = () => {
  const items=[
    {
      key: "Theatres",
      label: "Theatres",
      children: <TheatreList/>

    }
  ]
  return (
    <div style={{margin: '10px'}}>
      <Title level={2}>Partner Dashboard</Title>
      <Tabs items={items}/>
    </div>
  )
}

export default Partner