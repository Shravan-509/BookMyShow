import { EnvironmentOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Empty, Popover, Row, Spin, Typography } from 'antd'
const { Title, Text } = Typography;
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { getTheatresWithShowsByMovieRequest, selectShow, selectShowError, selectShowLoading } from '../../../redux/slices/showSlice';

const ShowTime = () => {
    const params = useParams();
     const dispatch = useDispatch();
    const dateScrollRef = useRef(null);
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));

    const showLoading = useSelector(selectShowLoading);
    const showError = useSelector(selectShowError)
    const theatres = useSelector(selectShow);

    useEffect(() => {
        dispatch(getTheatresWithShowsByMovieRequest({movie: params.id, date: selectedDate}))
    }, [selectedDate])

    // Generate dates for the next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => moment().add(i, "days"))
    
    const scrollDates = (direction) => 
    {
        if (dateScrollRef.current) 
        {
            const scrollAmount = direction === "left" ? -200 : 200
            dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }
    
    const getDateLabel = (date) => 
    {
        const today = moment();
        const tomorrow = moment().add(1, "day")

        if (date.isSame(today, "day")) 
        {
            return "Today"
        } 
        else if (date.isSame(tomorrow, "day")) 
        {
            return "Tomorrow"
        } 
        else 
        {
            return date.format("ddd")
        }
    }

    const handleDateSelect = (date) => {
        setSelectedDate(moment(date).format("YYYY-MM-DD"));
        navigate(`/movie/${params.id}/${moment(date).format("YYYYMMDD")}`)
    }

    if (showLoading) {
        return (
          <div className="loader-container">
            <Spin size='large'/>
          </div>
        )
    }

    if(showError){
        notify("error", "Sorry, something went wrong", showError);
    }

  return (
    <Card>
        {/* <Title level={4} style={{marginTop: 0}}>
            Select Date
        </Title> */}
        <div className='date-selection-container'>
            <Button
                type='text'
                icon = {<LeftOutlined/>}
                className='date-scroll-button left'
                onClick={() => scrollDates("left")}
            />

            <div className="date-tabs-container" ref={dateScrollRef}>
                {dates.map((date, index) => (
                    <div
                        key={index}
                        className={`date-tab ${moment(selectedDate).isSame(date, "day") ? "selected" : ""}`}
                        onClick={() => handleDateSelect(date)}
                    >
                        <div className="date-tab-day">{getDateLabel(date)}</div>
                        <div className="date-tab-date">{date.format("D")}</div>
                        <div className="date-tab-month">{date.format("MMM")}</div>
                    </div>
                ))}
            </div>

            <Button
                type='text'
                icon = {<RightOutlined />}
                className='date-scroll-button right'
                onClick={() => scrollDates("right")}
            />
        </div>

        <Divider/>

        {/* <Title level={4}>Available Show Timings</Title> */}

        {/* Theater and Showtimes Section - Horizontal Layout with Dividers */}
        {
            theatres && theatres.length > 0 ? (
                <div className="theaters-container">
                {
                    theatres.map((theatre, index) => (
                        <div key={index}>
                            <div  className='theatre-section'>
                                <Row gutter={[16, 16]} align="middle" style={{minHeight: '50px'}}>
                                    {/* Theater Info - Left Side */}
                                    <Col xs={24} sm={8} md={12}>
                                        <div className="theater-info">
                                            <Text strong style={{ margin: 0 }}>
                                                {theatre.name}
                                            </Text>
                                            <Popover 
                                                content={<Text >{theatre.address} </Text>}
                                            >  
                                                <Text type="secondary" style={{ display: "flex", alignItems: "center"}}>    
                                                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                                                    INFO
                                                </Text>
                                            </Popover>  
                                        </div>
                                    </Col>

                                    {/* Showtimes - Right Side */}
                                    <Col xs={24} sm={16} md={12}>
                                        <div className="showtime-buttons-horizontal">
                                            {
                                                [...theatre.shows]
                                                .sort((a, b) => moment(a.time, "HH:mm") - moment(b.time, "HH:mm"))
                                                .map((singleShow, index) => 
                                                    (
                                                        <div key={index} className="showtime-button-container">
                                                            <Popover 
                                                                content={
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <Text className="price-label">
                                                                            ₹ {singleShow.ticketPrice}.00
                                                                        </Text>
                                                                        <Text className="price-label">
                                                                            Available
                                                                        </Text>
                                                                    </div>
                                                                }
                                                            >
                                                                <Button className="showtime-button" onClick={() => navigate(`/booking/${singleShow._id}`)}>
                                                                    {
                                                                        moment(singleShow.time, "HH:mm").format("hh:mm A")
                                                                    }
                                                                </Button>
                                                            </Popover>
                                                        </div>
                                                    )
                                                )
                                            }
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                            {/* Add divider only if it's not the last theater */}
                            {index < theatres.length - 1 && <Divider style={{ margin: "16px 0" }} />}
                        </div>
                    ))
                }
                </div>                                     
            ) : (
                <div className="no-shows-message">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No shows available for this date"
                />
                </div>
            )
        }
    </Card>
  )
}

export default ShowTime