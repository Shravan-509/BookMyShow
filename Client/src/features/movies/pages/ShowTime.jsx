import { EnvironmentOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Empty, Popover, Spin, Typography, Alert, Skeleton } from 'antd'
const { Title, Text } = Typography;
import { addDays, compareAsc, format, isSameDay, isToday, isTomorrow, isValid, parse, parseISO } from 'date-fns';
import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { formatParsedTime } from "../../../utils/dateFormatter"
import { getTheatresWithShowsByMovieRequest, selectShow, selectShowError, selectShowLoading } from '../../../redux/slices/showSlice';

const getSelectedDateFromRoute = (dateParam) => {
    if (!dateParam) {
        return format(new Date(), "yyyy-MM-dd")
    }

    const parsedRouteDate = parse(dateParam, "yyyyMMdd", new Date())

    return isValid(parsedRouteDate)
        ? format(parsedRouteDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
}

const getScreenLabel = (show) => {
    const screen = show?.screen

    if (!screen) {
        return ""
    }

    return screen.name || (screen.screenNumber ? `Screen ${screen.screenNumber}` : "")
}

const getShowPriceLabel = (show) => {
    const pricingValues = Object.values(show?.ticketPricing || {})
        .map((price) => Number(price))
        .filter((price) => Number.isFinite(price) && price > 0)

    const lowestPrice = pricingValues.length
        ? Math.min(...pricingValues)
        : Number(show?.ticketPrice)

    return Number.isFinite(lowestPrice) && lowestPrice > 0
        ? `₹${lowestPrice}`
        : "Price unavailable"
}

const getLocality = (address = "") => {
    const [locality] = address.split(",").map((part) => part.trim()).filter(Boolean)
    return locality || address
}

const ShowTime = memo(() => {
    const params = useParams();
    const dispatch = useDispatch();
    const dateScrollRef = useRef(null);
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(() => getSelectedDateFromRoute(params.date));
    const [deviceType, setDeviceType] = useState('desktop')
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
            setDeviceType(getDeviceType(width))
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Computed responsive values
    const isMobile = deviceType === 'mobile'

    useEffect(() => {
        const routeDate = getSelectedDateFromRoute(params.date)
        setSelectedDate((currentDate) => currentDate === routeDate ? currentDate : routeDate)
    }, [params.date])

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

    const selectedDateObject = useMemo(() => parseISO(selectedDate), [selectedDate])

    const cityLabel = useMemo(() => {
        if (!Array.isArray(theatres) || theatres.length === 0) {
            return ""
        }

        const city = theatres.find((theatre) => theatre?.city?.cityName)?.city?.cityName
        return city || ""
    }, [theatres])
    
    const handleDateSelect = useCallback((date) => {
        setSelectedDate(format(date, "yyyy-MM-dd"));
        navigate(`/movie/${params.id}/${format(date, "yyyyMMdd")}`)
    }, [navigate, params.id])

    // Enhanced loading state
    if (showLoading) {
        return (
            <section className="showtime-panel" aria-label="Loading show times">
                <Skeleton active paragraph={{ rows: 5 }} title={{ width: "40%" }} />
                <div className="showtime-loading-copy">
                    <Spin size="small" />
                    <span>Loading showtimes...</span>
                </div>
            </section>
        )
    }

    // Enhanced error state
    if (showError) {
        return (
            <section className="showtime-panel">
                <Alert
                    title="Unable to Load Show Times"
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
            </section>
        )
    }

  return (
    <section
        className="showtime-panel"
        role="main"
        aria-label="Show times and theater information"
    >
        <div className="showtime-panel-header">
            <div>
                <Title level={3} className="showtime-heading">Choose Show</Title>
                <Text type="secondary">Select your preferred theatre and showtime</Text>
            </div>
            {cityLabel && (
                <div className="showtime-city-pill" aria-label={`Current city ${cityLabel}`}>
                    <EnvironmentOutlined aria-hidden="true" />
                    <span>{cityLabel}</span>
                </div>
            )}
        </div>

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
                        className={`date-tab ${isSameDay(selectedDateObject, date) ? "selected" : ""}`}
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

        {
            theatres && theatres.length > 0 ? (
                <div className="theaters-container">
                    {theatres.map((theatre, index) => (
                        <article className='theatre-section' key={theatre._id || index}>
                            <div className="theater-info">
                                <div>
                                    <Title level={4} className="theatre-name">
                                        {theatre.name}
                                    </Title>
                                    {theatre.address && (
                                        <Text className="theatre-address">
                                            {getLocality(theatre.address)}
                                        </Text>
                                    )}
                                </div>
                                {theatre.address && (
                                    <Popover
                                        content={
                                            <div style={{ maxWidth: 280 }}>
                                                <Text strong style={{ display: "block", marginBottom: "4px" }}>
                                                    Address
                                                </Text>
                                                <Text>{theatre.address}</Text>
                                            </div>
                                        }
                                        title="Theatre information"
                                    >
                                        <Button
                                            type="link"
                                            className="map-link"
                                            icon={<EnvironmentOutlined />}
                                        >
                                            View location
                                        </Button>
                                    </Popover>
                                )}
                            </div>

                            <div className="showtime-buttons-horizontal">
                                {[...(theatre.shows || [])]
                                    .sort((a, b) => compareAsc(
                                        parse(a.time, "HH:mm", new Date()),
                                        parse(b.time, "HH:mm", new Date())
                                    ))
                                    .map((singleShow) => {
                                        const screenLabel = getScreenLabel(singleShow)

                                        return (
                                            <Popover
                                                key={singleShow._id}
                                                content={
                                                    <div className="showtime-popover">
                                                        <Text strong>{getShowPriceLabel(singleShow)}</Text>
                                                        <Text type="secondary">Available</Text>
                                                        {screenLabel && <Text type="secondary">{screenLabel}</Text>}
                                                    </div>
                                                }
                                            >
                                                <Button
                                                    className="showtime-button"
                                                    onClick={() => navigate(`/booking/${singleShow._id}`)}
                                                    size={isMobile ? "small" : "middle"}
                                                    aria-label={`Book ${formatParsedTime(singleShow.time)} at ${theatre.name}`}
                                                >
                                                    <span>{formatParsedTime(singleShow.time)}</span>
                                                    {screenLabel && <small>{screenLabel}</small>}
                                                </Button>
                                            </Popover>
                                        )
                                    })
                                }
                            </div>
                        </article>
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
    </section>
  )
})

ShowTime.displayName = "ShowTime"
export default ShowTime
