import React, { useEffect, useState } from "react"
import moment from "moment"

import { Link, useParams } from "react-router-dom"
import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined} from "@ant-design/icons"
import { getShowsById } from "../../../api/show"
import { Button, Card, Col, Divider, Form, Input, InputNumber, message, Row, Skeleton, Space, Steps, Tag, Typography } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { hideLoading, showLoading } from "../../../redux/slices/loaderSlice";
import { SeatLayout } from "../../../components/SeatLayout"
import { useAuth } from "../../../hooks/useAuth"
import PaymentSummary from "./Checkout"
const { Title ,Text, Paragraph } = Typography;
const { Step } = Steps

const Booking = () => {
    const {user} = useAuth();  
    const params = useParams();
    const dispatch = useDispatch();
    const [contactForm] = Form.useForm()
    const [show, setShow] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [ticketCount, setTicketCount] = useState(2);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const {loading} = useSelector((state) => state.loader)

    const getData = async () => {
        try {
            dispatch(showLoading());
            const response = await getShowsById(params.id);
            if(response.success)
            {
                setShow(response.data);
            }
            else{
                message.warning(response.message)
            }
        } catch (error) {
            message.error(error.message);
        }finally{
            dispatch(hideLoading());
        }
    }

    useEffect(() => {
        getData(); 
    }, [])

    const handleTicketCount = (value) => {
        if(value)
        {
            setTicketCount(value);
            setSelectedSeats([]);
        }
    }

    const handlePreviousStep = () => {
        setCurrentStep(currentStep - 1);
    }

    const handleNextStep = () => {
        if(currentStep === 0 && selectedSeats.length !== ticketCount)
        {
            message.warning(`Please select exactly ${ticketCount} seats`);
            return;
        }

        if(currentStep === 1)
        {
            contactForm
                .validateFields()
                .then(() => {
                    setCurrentStep(currentStep + 1)
                })
                .catch((info) => {
                    message.warning(`Validate failed : ${info}`)
                })
            return;
        }

        setCurrentStep(currentStep + 1);
    }

    const handleSeatSelection = (seatId) => {
        if(selectedSeats.includes(seatId))
        {
            setSelectedSeats((prev) => prev.filter((id) => id !== seatId))
        }
        else if(selectedSeats.length < ticketCount)
        {
            setSelectedSeats(prev => [...prev, seatId])
        }
        else
        {
            message.warning(`You can only select ${ticketCount} seats`);
        }
    }

    if (loading) {
    return (
      <div className="min-h-screen p-6 md:p-12 bg-gray-50 flex justify-center">
        <Card className="w-full max-w-4xl">
            <div className="text-center py-12">
                <Skeleton active paragraph={{ rows: 4 }} />
                <Row gutter={[24, 24]} className="mt-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <Col xs={24} md={12} key={i}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                    </Col>
                ))}
                </Row>
            </div>
        </Card>
      </div>
    )
  }

    if (!show) {
    return (
      <div className="min-h-screen p-6 md:p-12 bg-gray-50 flex flex-col items-center justify-center">
        <Title level={3}>Booking details not found</Title>
        <Link to="/">
          <Button type="primary" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    show && (
        <main className="min-h-screen p-6 md:p-12 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <Link to={`/movie/${show.movie._id}/${moment().format("YYYYMMDD")}`}>
                    <ArrowLeftOutlined className="h-4 w-4 mr-2"/>
                    Back to Theatre
                </Link>

                <div className="mb-6 mt-5">
                    <Card >
                        <div className="flex flex-col justify-between items-start mb-6">
                            <Title level={3} className="!mb-1">
                                {show.movie.movieName}
                            </Title>

                            <Space direction="vertical" size={4} className="!mb-2">
                                <Space size="middle" wrap>
                                    <Text>{show.theatre.name}</Text>
                                    <Tag color="blue" className="!flex !gap-1">
                                        <CalendarOutlined/>{moment(show.date).format("ddd, DD MMM, YYYY")}
                                        <ClockCircleOutlined/> {moment(show.time, "HH:mm").format("hh:mm A")}</Tag>
                                </Space>
                            </Space>
                        </div>

                        <Steps current={currentStep} className="!mb-8">
                            <Step title="Select Seats"/>
                            <Step title="Your Details"/>
                            <Step title="Payment"/>
                        </Steps>

                        {
                            currentStep === 0 && (
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                                        <Title level={4} className="!mb-2 !md:mb-0">
                                            Select Number of Tickets
                                        </Title>
                                        <InputNumber className="w-24" min={1} max={5} value={ticketCount} onChange={handleTicketCount}/>
                                    </div>

                                    <Divider/>
                                    <div className="mb-6">
                                        <div className="overflow-x-auto max-w-full">
                                            <div className="min-w-[650px]">
                                                <SeatLayout
                                                    totalSeats={show.totalSeats}
                                                    bookedSeats={show.bookedSeats}
                                                    selectedSeats={selectedSeats}
                                                    onSeatSelect={handleSeatSelection}
                                                />

                                                <div className="flex flex-col items-center mt-6">
                                                    <svg
                                                        width="300"
                                                        height="50"
                                                        viewBox="0 0 300 50"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <polygon
                                                        points="10,40 30,10 270,10 290,40"
                                                        fill="#D6E9FF"
                                                        stroke="#B0D4FF"
                                                        strokeWidth="1"
                                                        />
                                                        <polygon
                                                        points="10,40 290,40 285,45 15,45"
                                                        fill="#EAF4FF"
                                                        stroke="#B0D4FF"
                                                        strokeWidth="1"
                                                        />
                                                    </svg>
                                                    <div className="text-xs text-gray-700 mt-2">
                                                        All eyes this way please!
                                                    </div>
                                                </div>

                                                <div className="flex justify-center mt-12">
                                                    <div className="flex items-center mr-6">
                                                        <div className="w-4 h-4 bg-gray-200 rounded-sm mr-2"/>
                                                        <Text> Available</Text>
                                                    </div>
                                                
                                                    <div className="flex items-center mr-6">
                                                        <div className="w-4 h-4 bg-[#1ea83c] rounded-sm mr-2"/>
                                                        <Text>Selected</Text>
                                                    </div>
                                                
                                                    <div className="flex items-center mr-6">
                                                        <div className="w-4 h-4 bg-gray-500 rounded-sm mr-2"/>
                                                        <Text>Booked</Text>     
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Divider/>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Text className="block">Selected: </Text>
                                                <Text strong> {selectedSeats.length > 0 ? selectedSeats.join(", "): "None"} </Text>
                                            </div>
                                            <Button 
                                                type="primary" 
                                                size="large" 
                                                onClick={handleNextStep}
                                                disabled={selectedSeats.length !== ticketCount}
                                                className={`!bg-[#f84464] transition-colors duration-200 ${
                                                    selectedSeats.length !== ticketCount
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:!bg-[#dc3558]'
                                                }`}
                                            >
                                                Continue
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {
                            currentStep === 1 && (
                                <div>
                                    <Title level={4} className="!mb-6">
                                        Your Contact Details
                                    </Title>
                                    <Form
                                        form={contactForm}
                                        layout="vertical"
                                        initialValues={{
                                            name: user?.name,
                                            email: user?.email,
                                            phone: user?.phone,
                                        }}
                                    >
                                        <Form.Item
                                            name={"name"}
                                            label="Full Name"
                                            rules={[{ required: true, message: "Please enter your name"}]}
                                        >
                                            <Input placeholder="Enter your full name"/>
                                        </Form.Item>

                                        <Form.Item
                                            name={"email"}
                                            label="Email Address"
                                            rules={[
                                                { required: true, message: "Please enter your email"},
                                                { type: "email",  message: "Please enter a valid email"}

                                            ]}
                                        >
                                            <Input placeholder="Enter your email address"/>
                                        </Form.Item>

                                        <Form.Item
                                            name={"phone"}
                                            label="Phone Number"
                                            rules={[
                                                { required: true, message: "Please enter your phone number"},
                                                { pattern: /^[6-9]\d{9}$/,  message: "Please enter a valid 10-digit phone number"}

                                            ]}
                                        >
                                            <Input placeholder="Enter your 10-digit phone number"/>
                                        </Form.Item>

                                        <Divider/>

                                        <div className="flex justify-between">
                                            <Button 
                                                size="large" 
                                                onClick={handlePreviousStep}
                                                // className="hover:!border-[#f84464] hover:!text-black"
                                            >
                                                Back
                                            </Button>
                                            <Button 
                                                type="primary" 
                                                size="large" 
                                                onClick={handleNextStep} 
                                                className="!bg-[#f84464] hover:!bg-[#dc3558]">
                                               Proceed to Pay
                                            </Button>

                                        </div>
                                    </Form>
                                </div>
                            )
                        }

                        {
                            currentStep === 2 && (
                                <PaymentSummary
                                    show = {show}
                                    seats = {selectedSeats}
                                    handlePreviousStep = {handlePreviousStep}
                                />
                            )
                        }
                    </Card>
                </div>
            </div>
        </main>

    )
  )
}

export default Booking