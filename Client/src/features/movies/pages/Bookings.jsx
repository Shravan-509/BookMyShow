import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Divider, Flex, QRCode, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';
import moment from "moment";
const {Text, Title} = Typography;
import armChairUrl from "../../../assets/arm_chair.svg"; 
import { useAuth } from '../../../hooks/useAuth';
import { bookingsByUserId } from '../../../api/booking';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from "../../../redux/slices/loaderSlice";
import NoBookings from './NoBookings';
import { scheduleBookingReminder } from "../../../utils/reminderUtils"
import { notify } from '../../../utils/notificationUtils';

const OrderHistory = () => {
    const { user } = useAuth(); 
    const [bookings, setBookings] = useState([]);
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.loader)

  const getData = async () => {
    try 
    {
      dispatch(showLoading());
      const response = await bookingsByUserId(user._id);
      if(response.success)
      {
          setBookings(response.data);

          response.data.forEach((booking) => {
            const showDateTime = moment(`${booking.showDate} ${booking.showTime}`, "YYYY-MM-DD HH:mm");
            if(showDateTime.isAfter(moment()))
            {
              scheduleBookingReminder(booking)
            }
          })
      }
      else
      {
        notify("warning", response.message);
      }
    } catch (error) {
        notify("error", error.message);
    }finally{
        dispatch(hideLoading());
    }
  }

    useEffect(() => {
        getData(); 
    }, []);
  
  if (loading) {
      return (
        <div className="max-w-3xl mx-auto mt-6 px-2">
          <Card className="!rounded-xl">
            <Skeleton avatar paragraph={{ rows: 6 }} active />
          </Card>
        </div>
      );
    }

  return (
    <>
    {
      bookings.length === 0 ? <NoBookings/>
    :
      <div>
        {
          bookings.map((booking, id) => {
            let seatCount = booking.seats.length; 
            let baseTotal = booking.ticketPrice * seatCount;
            let convenienceFee = booking.convenienceFee; 
            let grandTotal = baseTotal + convenienceFee;
            // Round to 2 decimals
            grandTotal = Math.round(grandTotal * 100) / 100;
            return (
              <div key={id} className="max-w-5xl mx-auto bg-[#f5f5f5] p-3 rounded-xl">
                <Card 
                  className='!shadow-sm !rounded-xl !relative'
                  variant={'borderless'}
                >
                  <div className="absolute right-6 top-6 flex items-center gap-3">
                    <Tag color="green" className="!text-sm !px-3 !py-1 rounded-full">
                      {booking.ticketStatus}
                    </Tag>
                    <Button
                      icon={<BarcodeOutlined />}
                      type="default"
                      className="!border-[#f84464] !text-[#f84464] hover:!border-[#dc3558] hover:!text-[#dc3558]"
                      // onClick={generatePDF}
                    >
                      View Booking Info
                    </Button>
                  </div>

                  <Flex wrap="wrap" gap={24}>
                    <img 
                      alt="Movie Poster" 
                      src={booking.poster || "/placeholder.svg"} 
                      className="!rounded-lg"
                      style={{ height: 200, width: 130, objectFit: "cover"}}
                    />   
                    
                    <div className="ticket-divider" />
                                
                    <Flex vertical className="flex-1">
                        <Space direction='vertical' className='w-full'>
                          <Title level={4} className="!mb-1">
                            #{booking.movieTitle} <span className="text-sm text-gray-500">2D</span>
                          </Title>
                          <Text strong className="!text-lg">
                            {moment(booking.showDate).format('ddd, DD MMM YYYY')} | {" "}
                            {moment(booking.showTime, "HH:mm").format("hh:mm A")}
                          </Text>
                          <Text type='secondary'>
                            {booking.theatreName}
                          </Text>
                          <Text type='secondary'>
                            Quantity : {seatCount}
                          </Text>
                          <Text strong>
                            <div className="flex items-center gap-2">
                                <img src={armChairUrl || "/placeholder.svg"} alt="Seat Icon" />
                                <span>
                                  {booking.seatType?.toUpperCase()} - {booking.seats.join(', ')}
                                </span>
                              </div> 
                          </Text>

                          <Row justify="space-between">
                            <Col>
                              <Text>Ticket Price</Text> 
                            </Col>
                            <Col>
                              ₹{booking.ticketPrice * seatCount}
                            </Col>
                          </Row>

                          <Row justify="space-between">
                            <Col>
                              <Text>
                                Convenience Fee
                              </Text>
                              <div className="text-xs text-gray-500">Incl. of Tax</div>
                            </Col>
                            <Col>
                              ₹{convenienceFee}
                            </Col>
                          </Row>

                          <Divider style={{border: '1px dashed rgb(229, 229, 229)', margin: '8px 0'}}/>

                          <Row justify="space-between" align="middle">
                            <Col>
                              <Text strong>Amount Paid</Text>
                            </Col>
                            <Col>
                              <Text strong className="!text-xl">₹{grandTotal}</Text>
                            </Col>
                          </Row>
                      </Space>
                    </Flex> 

                    {/* QR Code Generation */}
                    <div className="flex justify-center items-center">
                      <QRCode value={booking.bookingId} size={100} />
                    </div>
                  </Flex>   
                </Card>

                <div
                  style={{
                    margin: "16px 0px 36px",
                    color: "rgb(102, 102, 102)",
                    display: "flex",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ margin: "0px 50px 0px 0px"}}>
                    <Text style={{ fontSize: "10px", fontWeight: 400, color: "rgb(102, 102, 102)"}}>BOOKING DATE & TIME</Text>
                    <div style={{ fontSize: "12px",fontWeight: 400, color: "rgb(51, 51, 51)"}}>
                      {moment(booking.bookingTime).format('MMM DD YYYY')} {" "} 
                      {moment(booking.bookingTime).format('hh:mm A')}
                    </div>
                  </div>

                  <div style={{ margin: "0px 50px 0px 0px"}}>
                    <Text style={{ fontSize: "10px", fontWeight: 400, color: "rgb(102, 102, 102)"}}>PAYMENT METHOD</Text>
                    <div style={{ fontSize: "12px",fontWeight: 400, color: "rgb(51, 51, 51)"}}>
                      {booking.paymentMethod || 'N/A'}
                    </div>
                  </div>

                  <div style={{ margin: "0px 50px 0px 0px"}}>
                    <Text style={{ fontSize: "10px", fontWeight: 400, color: "rgb(102, 102, 102)"}}>BOOKING ID</Text>
                    <div style={{ fontSize: "12px",fontWeight: 400, color: "rgb(51, 51, 51)"}}>
                      {booking.bookingId}
                      </div>
                  </div>
                </div>
              </div>
            ) 
          })
        }
      </div>
    }
    </>
    
  )
}

export default OrderHistory