import React from 'react';
import { Tabs } from 'antd';
import TheatreList from './TheatreList';
import Title from 'antd/es/typography/Title';
import TheatreBookings from './TheatreBooking';
import RevenueTracking from './RevenueTracking';

const Partner = () => {
  const items=[
    {
      key: "Theatres",
      label: "Theatres",
      children: <TheatreList/>
    },
    {
      key: "Bookings",
      label: "Theatre Bookings",
      children: <TheatreBookings/>
    },
    {
      key: "Revenue",
      label: "Revenue Tracking",
      children: <RevenueTracking />,
    },
  ]
  return (
    <div style={{margin: '10px'}}>
      <Title level={2}>Partner Dashboard</Title>
      <Tabs items={items}/>
    </div>
  )
}

export default Partner