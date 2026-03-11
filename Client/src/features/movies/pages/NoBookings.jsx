import { VideoCameraOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import Paragraph from 'antd/es/typography/Paragraph';
import Title from 'antd/es/typography/Title';
import React from 'react'
import { useNavigate } from 'react-router-dom'

const NoBookings = () => {
    const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="mb-6 text-[#f84464] text-5xl">
            <VideoCameraOutlined/>
        </div>

        <Title className="mb-2! text-2xl!">No Tickets Available</Title>
        <Paragraph className="text-gray-500! mb-4!">
            Looks like you haven't booked any tickets yet.
        </Paragraph>

        <Button
            type="primary"
            size="large"
            className="bg-[#f84464]! hover:bg-[#dc3558]! border-none! text-white!"
            onClick={() => navigate('/home')}
        >
            Browse Movies
        </Button>
    </div>
  )
}

export default NoBookings