import React, {lazy, Suspense} from 'react';
import { Tabs, Spin } from 'antd';
import Title from 'antd/es/typography/Title';

const TheatreList = lazy(() => import('./TheatreList'));
const TheatreBookings = lazy(() => import('./TheatreBooking'));
const RevenueTracking = lazy(() => import('./RevenueTracking'));

const TabLoader = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <Spin size="large" />
  </div>
);

const Partner = () => {
  const items=[
    {
      key: "Theatres",
      label: "Theatres",
      children: (
        <Suspense fallback={<TabLoader />}>
          <TheatreList />
        </Suspense>
      ),
    },
    {
      key: "Bookings",
      label: "Theatre Bookings",
      children: (
        <Suspense fallback={<TabLoader />}>
          <TheatreBookings />
        </Suspense>
      ),
    },
    {
      key: "Revenue",
      label: "Revenue Tracking",
      children: (
        <Suspense fallback={<TabLoader />}>
          <RevenueTracking />
        </Suspense>
      ),
    },
  ]
  return (
    <div style={{margin: '10px'}}>
      <Title level={2}>Partner Dashboard</Title>
      <Tabs items={items} destroyOnHidden/>
    </div>
  )
}

export default Partner