import React from 'react'
import MovieList from './MovieList'
import TheatreList from './TheatreList'
import { Tabs } from 'antd'
import Title from 'antd/es/typography/Title'

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
    }
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