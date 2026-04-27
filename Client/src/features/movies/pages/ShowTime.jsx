import { EnvironmentOutlined, LeftOutlined, RightOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Empty, Popover, Row, Spin, Typography, Alert, Skeleton, Tag } from 'antd'
const { Title, Text } = Typography;
import { addDays, compareAsc, format, isSameDay, isToday, isTomorrow, parse, parseISO } from 'date-fns';
import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { formatParsedTime } from "../../../utils/dateFormatter"
import { getTheatresWithShowsByMovieRequest, selectShow, selectShowError, selectShowLoading } from '../../../redux/slices/showSlice';

const ShowTime = memo(() => {
    const params = useParams();
    const dispatch = useDispatch();
    const dateScrollRef = useRef(null);
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [deviceType, setDeviceType] = useState('desktop')
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

    const showLoading = useSelector(selectShowLoading);
    const showError = useSelector(selectShowError)
    const theatres = useSelector(selectShow);

    // Enhanced device detection
    useEffect(() => {
        const getDeviceType = (width) => {
            if (width < 640) return 'mobile'
            if (width < 1024) return 'tablet'
            return 'desktop'
        }

        const handleResize = () => {
            const width = window.innerWidth
            setWindowWidth(width)
            setDeviceType(getDeviceType(width))
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Computed responsive values
    const isMobile = deviceType === 'mobile'
    const isTablet = deviceType === 'tablet'
    const isDesktop = deviceType === 'desktop'

    useEffect(() => {
        dispatch(getTheatresWithShowsByMovieRequest({movie: params.id, date: selectedDate}))
    }, [selectedDate, dispatch, params.id])

    // Generate dates for the next 7 days (memoized)
    const dates = useMemo(() => 
        Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), 
        []
    )
    
    const scrollDates = useCallback((direction) => {
        if (dateScrollRef.current) {
            const scrollAmount = direction === "left" ? -200 : 200
            dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }, [])
    
    const getDateLabel = useCallback((date) => {
        if(isToday(date)) return "Today";
        if(isTomorrow(date)) return "Tomorrow";
        return format(date, "EEE")
    }, [])
    
    const handleDateSelect = useCallback((date) => {
        setSelectedDate(format(date, "yyyy-MM-dd"));
        navigate(`/movie/${params.id}/${format(date, "yyyyMMdd")}`)
    }, [navigate, params.id])

    // Enhanced loading state
    if (showLoading) {
        return (
            <Card style={{ padding: isMobile ? "16px" : "24px" }}>
                <div style={{ textAlign: "center", padding: isMobile ? "20px" : "40px" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16, color: "#666", fontSize: isMobile ? "14px" : "16px" }}>
                        Loading show times...
                    </div>
                </div>
            </Card>
        )
    }

    // Enhanced error state
    if (showError) {
        return (
            <Card style={{ padding: isMobile ? "16px" : "24px" }}>
                <Alert
                    message="Unable to Load Show Times"
                    description="Sorry, we couldn't load the show times for this date. Please try again later."
                    type="error"
                    showIcon
                    action={
                        <Button 
                            size="small" 
                            danger 
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    }
                />
            </Card>
        )
    }

  return (
    <Card 
        style={{ 
            padding: isMobile ? "16px" : "24px",
            borderRadius: isMobile ? "8px" : "12px"
        }}
        role="main"
        aria-label="Show times and theater information"
    >
        <div className='date-selection-container'>
            <Button
                type='text'
                icon={<LeftOutlined />}
                className='date-scroll-button left'
                onClick={() => scrollDates("left")}
                aria-label="Scroll dates left"
            />

            <div 
                className="date-tabs-container" 
                ref={dateScrollRef}
            >
                {dates.map((date, index) => (
                    <div
                        key={index}
                        className={`date-tab ${isSameDay(parseISO(selectedDate), date) ? "selected" : ""}`}
                        onClick={() => handleDateSelect(date)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ${getDateLabel(date)}, ${format(date, "MMM d")}`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleDateSelect(date)
                            }
                        }}
                    >
                        <div className="date-tab-day">
                            {getDateLabel(date)}
                        </div>
                        <div className="date-tab-date">
                            {format(date, "d")}
                        </div>
                        <div className="date-tab-month">
                            {format(date, "MMM")}
                        </div>
                    </div>
                ))}
            </div>

            <Button
                type='text'
                icon={<RightOutlined />}
                className='date-scroll-button right'
                onClick={() => scrollDates("right")}
                aria-label="Scroll dates right"
            />
        </div>

        <Divider style={{ margin: isMobile ? "16px 0" : "24px 0" }} />

        {/* <Title level={4}>Available Show Timings</Title> */}

        {/* Theater and Showtimes Section - Responsive Layout */}
        {
            theatres && theatres.length > 0 ? (
                <div className="theaters-container">
                    {theatres.map((theatre, index) => (
                        <div key={index}>
                            <div className='theatre-section'>
                                <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} align="middle">
                                    {/* Theater Info - Left Side */}
                                    <Col xs={24} sm={isMobile ? 24 : 8} md={12}>
                                        <div className="theater-info">
                                            <Text 
                                                strong 
                                                style={{ 
                                                    margin: 0,
                                                    fontSize: isMobile ? "16px" : "18px",
                                                    display: "block",
                                                    marginBottom: "8px"
                                                }}
                                            >
                                                {theatre.name}
                                            </Text>
                                            <Popover 
                                                content={
                                                    <div style={{ padding: "8px" }}>
                                                        <Text strong style={{ display: "block", marginBottom: "4px" }}>
                                                            Address:
                                                        </Text>
                                                        <Text>{theatre.address}</Text>
                                                    </div>
                                                }
                                                title="Theater Information"
                                            >  
                                                <Button 
                                                    type="link" 
                                                    size={isMobile ? "small" : "middle"}
                                                    style={{ 
                                                        padding: 0,
                                                        height: "auto",
                                                        fontSize: isMobile ? "12px" : "14px"
                                                    }}
                                                    icon={<EnvironmentOutlined />}
                                                >
                                                    View Location
                                                </Button>
                                            </Popover>  
                                        </div>
                                    </Col>

                                    {/* Showtimes - Right Side */}
                                    <Col xs={24} sm={isMobile ? 24 : 16} md={12}>
                                        <div className="showtime-buttons-horizontal">
                                            {[...theatre.shows]
                                                .sort((a, b) => compareAsc(
                                                    parse(a.time, "HH:mm", new Date()),  
                                                    parse(b.time, "HH:mm", new Date())
                                                ))
                                                .map((singleShow, showIndex) => (
                                                    <div key={showIndex} className="showtime-button-container">
                                                        <Popover 
                                                            content={
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    flexDirection: 'column'
                                                                }}>
                                                                        
                                                                        <Text className="price-label">
                                                                            ₹ {singleShow.ticketPrice}.00
                                                                        </Text>
                                                                    <Text className="price-label">
                                                                        Available
                                                                    </Text>
                                                                </div>
                                                            }
                                                        >
                                                            <Button 
                                                                className="showtime-button" 
                                                                onClick={() => navigate(`/booking/${singleShow._id}`)}
                                                                size={isMobile ? "small" : "middle"}
                                                            >
                                                                {formatParsedTime(singleShow.time)}
                                                            </Button>
                                                        </Popover>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                            {/* Add divider only if it's not the last theater */}
                            {index < theatres.length - 1 && (
                                <Divider 
                                    style={{ 
                                        margin: isMobile ? "12px 0" : "16px 0",
                                        borderColor: "#e8e8e8"
                                    }} 
                                />
                            )}
                        </div>
                    ))}
                </div>                                     
            ) : (
                <div className="no-shows-message">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div>
                                <Text type="secondary" style={{ fontSize: isMobile ? "14px" : "16px" }}>
                                    No shows available for this date
                                </Text>
                                <div style={{ marginTop: "12px" }}>
                                    <Button 
                                        type="primary" 
                                        size={isMobile ? "small" : "middle"}
                                        onClick={() => window.location.reload()}
                                    >
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        }
                    />
                </div>
            )
        }
    </Card>
  )
})

ShowTime.displayName = "ShowTime"
export default ShowTime