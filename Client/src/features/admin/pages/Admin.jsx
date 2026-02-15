import AllBookings from './AllBookings'
import MovieList from './MovieList'
import TheatreList from './TheatreList'
import { Tabs } from 'antd'
import Title from 'antd/es/typography/Title'
import UserManagement from './UserManagement'

const Admin = () => {
  const tabItems = [
    {
      key: "movies",
      label: "Movies",
      children: <MovieList/>
    },
    {
      key: "theatres",
      label: "Theatres",
      children: <TheatreList/>
    },
    {
      key: "bookings",
      label: "All Bookings",
      children: <AllBookings />,
    },
    {
      key: "users",
      label: "User Management",
      children: <UserManagement />,
    },
  ]

  return (
    <div style={{margin: '10px'}}>
      <Title level={2}>Admin Dashboard</Title>
      <Tabs 
        defaultActiveKey='movies' 
        items={tabItems}
        style={{ margin: "10px" }}
      />
    </div>
  )
}

export default Admin