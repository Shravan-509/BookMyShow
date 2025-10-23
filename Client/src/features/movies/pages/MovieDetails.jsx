import React, { useEffect, memo, useState, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { Button, Card, Col, Rate, Row, Space, Spin, Tabs, Tag, Typography, Alert, Skeleton, Divider } from 'antd';
import { 
    CalendarOutlined, 
    ClockCircleOutlined, 
    InfoCircleOutlined, 
    PlayCircleOutlined, 
    TeamOutlined,
    StarOutlined,
    GlobalOutlined,
    EyeOutlined
} from '@ant-design/icons';
const { Title, Paragraph, Text } = Typography;
import moment from "moment";
import { formatDuration } from '../../../utils/format-duration';

const ShowTime = React.lazy(() => import("./ShowTime"));
const MovieSynopsis = React.lazy(() => import ("./MovieSynopsis"));
import { 
    getMovieByIdRequest, 
    selectMovieError, 
    selectMovieLoading, 
    selectSelectedMovie 
} from '../../../redux/slices/movieSlice';
import { notify } from '../../../utils/notificationUtils';

const MovieInfo = memo(() => {
    const params = useParams();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState("showTimes")
    const [deviceType, setDeviceType] = useState('desktop')
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

    const movieLoading = useSelector(selectMovieLoading);
    const movieError = useSelector(selectMovieError)
    const movie = useSelector(selectSelectedMovie);

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

    const formattedDuration = useMemo(() => {
        return movie?.duration ? formatDuration(movie.duration) : ""
    }, [movie?.duration])

    const formattedReleaseDate = useMemo(() => {
        return movie?.releaseDate ? moment(movie.releaseDate).format("DD MMM, YYYY") : ""
    }, [movie?.releaseDate])

    const genreTags = useMemo(() => {
        return (
            movie?.genre?.map((g) => (
                <Tag key={g} color="blue" style={{ marginRight: 8, marginBottom: 8 }}>
                    {g}
                </Tag>
            )) || []
        )
    }, [movie?.genre])

    const languageTags = useMemo(() => {
        return (
            movie?.language?.map((lang) => (
                <Tag key={lang} color="volcano" style={{ marginRight: 8, marginBottom: 8 }}>
                    {lang}
                </Tag>
            )) || []
        )
    }, [movie?.language])

    const handleTabChange = useCallback((key) => {
        setActiveTab(key)
    }, [])

    // Optimize image loading
    const handleImageLoad = useCallback((e) => {
        e.target.style.opacity = '1'
    }, [])

    const handleImageError = useCallback((e) => {
        e.target.src = '/placeholder.svg'
        e.target.style.opacity = '1'
    }, [])

    // Define tab items with responsive design
    const tabItems = useMemo(
        () => [
            {
                key: "showTimes",
                label: (
                    <span 
                        className="flex items-center gap-2"
                        style={{ 
                            fontSize: isMobile ? "14px" : "16px",
                            fontWeight: 500
                        }}
                    >
                        <CalendarOutlined style={{ fontSize: isMobile ? "16px" : "18px" }} />
                        {isMobile ? "Times" : "Show Times"}
                    </span>
                ),
                children: (
                    <React.Suspense 
                        fallback={
                            <div style={{ padding: isMobile ? "20px" : "40px", textAlign: "center" }}>
                                <Spin size="large" />
                                <div style={{ marginTop: 16, color: "#666" }}>
                                    Loading show times...
                                </div>
                            </div>
                        }
                    >
                        <ShowTime />
                    </React.Suspense>
                )
            },
            {
                key: "about",
                label: (
                    <span 
                        className="flex items-center gap-2"
                        style={{ 
                            fontSize: isMobile ? "14px" : "16px",
                            fontWeight: 500
                        }}
                    >
                        <InfoCircleOutlined style={{ fontSize: isMobile ? "16px" : "18px" }} />
                        About
                    </span>
                ),
                children: (
                    <React.Suspense 
                        fallback={
                            <div style={{ padding: isMobile ? "20px" : "40px", textAlign: "center" }}>
                                <Spin size="large" />
                                <div style={{ marginTop: 16, color: "#666" }}>
                                    Loading movie details...
                                </div>
                            </div>
                        }
                    >
                        <MovieSynopsis movie={movie} />
                    </React.Suspense>
                )
            },
            {
                key: "cast",
                label: (
                    <span 
                        className="flex items-center gap-2"
                        style={{ 
                            fontSize: isMobile ? "14px" : "16px",
                            fontWeight: 500
                        }}
                    >
                        <TeamOutlined style={{ fontSize: isMobile ? "16px" : "18px" }} />
                        {isMobile ? "Cast" : "Cast & Crew"}
                    </span>
                ),
                children: (
                    <Card 
                        style={{ 
                            margin: isMobile ? "0" : "16px 0",
                            borderRadius: isMobile ? "8px" : "12px"
                        }}
                    >
                        <Title 
                            level={4} 
                            style={{ 
                                marginTop: 0,
                                fontSize: isMobile ? "18px" : "20px",
                                marginBottom: isMobile ? "16px" : "20px"
                            }}
                        >
                            Cast & Crew
                        </Title>
                        <div style={{ textAlign: "center", padding: isMobile ? "20px" : "40px" }}>
                            <Text type="secondary">
                                Cast information will be available soon.
                            </Text>
                        </div>
                    </Card>
                )
            }
        ],
        [movie, isMobile]
    )

    useEffect(() => {
        dispatch(getMovieByIdRequest(params.id))
    }, [dispatch, params.id])


    // Enhanced loading state
    if (movieLoading) {
        return (
            <div className="movie-details-loading" style={{ padding: isMobile ? '20px 16px' : '40px 0' }}>
                <div className="inner-container">
                    <Skeleton 
                        active 
                        avatar={{ size: isMobile ? 120 : 200, shape: 'square' }}
                        title={{ width: isMobile ? '80%' : '60%' }}
                        paragraph={{ rows: isMobile ? 3 : 4 }}
                    />
                </div>
            </div>
        )
    }

    // Enhanced error state
    if (movieError) {
        return (
            <div className="movie-details-error" style={{ padding: isMobile ? '20px 16px' : '40px 0' }}>
                <div className="inner-container">
                    <Alert
                        message="Unable to Load Movie Details"
                        description="Sorry, we couldn't load the movie information. Please try again later."
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
                </div>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="movie-details-not-found" style={{ padding: isMobile ? '20px 16px' : '40px 0' }}>
                <div className="inner-container">
                    <Alert
                        message="Movie Not Found"
                        description="The movie you're looking for doesn't exist or has been removed."
                        type="warning"
                        showIcon
                    />
                </div>
            </div>
        )
    }
    
  return (
    <>
        <div
            className="movie-banner"
            role="banner"
            aria-label={`${movie.title} movie details`}
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${movie.poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: isMobile ? "scroll" : "fixed",
                padding: isMobile ? "40px 0" : "80px 0",
                color: "white",
                minHeight: isMobile ? "auto" : "500px",
                position: "relative",
            }}
        >
            <div className="inner-container">
                <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]} align="middle">
                    <Col xs={24} sm={isMobile ? 24 : 8} md={6} lg={5}>
                        <div 
                            className="poster-container"
                            style={{
                                display: "flex",
                                justifyContent: isMobile ? "center" : "flex-start",
                                marginBottom: isMobile ? "20px" : "0"
                            }}
                        >
                            <img
                                alt={`${movie.title} movie poster`}
                                src={movie.poster || "/placeholder.svg"}
                                style={{
                                    width: isMobile ? "200px" : "100%",
                                    height: isMobile ? 280 : 320,
                                    objectFit: "cover",
                                    borderRadius: 12,
                                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                                    transition: "transform 0.3s ease",
                                    opacity: 0,
                                }}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                onMouseEnter={(e) => {
                                    if (!isMobile) {
                                        e.target.style.transform = "scale(1.05)"
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isMobile) {
                                        e.target.style.transform = "scale(1)"
                                    }
                                }}
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={isMobile ? 24 : 16} md={18} lg={19}>
                        <div style={{ textAlign: isMobile ? "center" : "left" }}>
                            <Title 
                                level={isMobile ? 2 : 1} 
                                style={{ 
                                    color: "white", 
                                    marginTop: 0, 
                                    marginBottom: 16,
                                    fontSize: isMobile ? "24px" : "32px",
                                    lineHeight: 1.2
                                }}
                            >
                                {movie.title}
                            </Title>

                            <Space 
                                size={isMobile ? 12 : 16} 
                                className="!mb-4"
                                direction={isMobile ? "vertical" : "horizontal"}
                                style={{ width: isMobile ? "100%" : "auto" }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Rate 
                                        disabled 
                                        defaultValue={4.5} 
                                        allowHalf 
                                        style={{ fontSize: isMobile ? 14 : 16 }} 
                                    />
                                    <Text style={{ color: "white", fontSize: isMobile ? "14px" : "16px" }}>
                                        4.5/5
                                    </Text>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <ClockCircleOutlined style={{ color: "#f84464" }} />
                                    <Text style={{ color: "white", fontSize: isMobile ? "14px" : "16px" }}>
                                        {formattedDuration}
                                    </Text>
                                </div>
                            </Space>

                            <div 
                                className="mb-4" 
                                style={{ 
                                    display: "flex", 
                                    flexWrap: "wrap", 
                                    justifyContent: isMobile ? "center" : "flex-start",
                                    gap: "8px"
                                }}
                            >
                                {genreTags}
                            </div>

                            <div 
                                className="mb-4" 
                                style={{ 
                                    display: "flex", 
                                    flexWrap: "wrap", 
                                    justifyContent: isMobile ? "center" : "flex-start",
                                    gap: "8px"
                                }}
                            >
                                {languageTags}
                            </div>

                            <Paragraph 
                                style={{ 
                                    color: "#e6e6e6", 
                                    marginBottom: 20,
                                    textAlign: isMobile ? "center" : "left",
                                    fontSize: isMobile ? "14px" : "16px"
                                }}
                            >
                                <CalendarOutlined style={{ marginRight: 8, color: "#f84464" }} />
                                Release: {formattedReleaseDate}
                            </Paragraph>

                            <div style={{ textAlign: isMobile ? "center" : "left" }}>
                                <Button 
                                    type="primary" 
                                    size={isMobile ? "middle" : "large"}
                                    icon={<PlayCircleOutlined />} 
                                    className='!bg-[#f84464] hover:!bg-[#dc3558]'
                                    style={{
                                        width: isMobile ? "100%" : "auto",
                                        height: isMobile ? "44px" : "48px",
                                        fontSize: isMobile ? "16px" : "18x",
                                        fontWeight: 600
                                    }}
                                >
                                    Watch Trailer
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>

        {/* Main Content Section */}
        <div 
            className='inner-container' 
            style={{
                paddingTop: isMobile ? "20px" : "40px",
                paddingBottom: isMobile ? "20px" : "40px",
                minHeight: "300px"
            }}
        >
            <Tabs  
                activeKey={activeTab}
                onChange={handleTabChange}
                items={tabItems}
                size={isMobile ? 'middle' : 'large'}
                style={{
                    marginBottom: isMobile ? 20 : 32, 
                    marginTop: isMobile ? 10 : 20
                }}
                tabPosition={isMobile ? 'top' : 'top'}
                centered={isMobile}
                type={isMobile ? 'card' : 'line'}
                className={isMobile ? 'mobile-tabs' : 'desktop-tabs'}
                aria-label="Movie information tabs"
                role="tablist"
            />  
        </div>
    </>
  )
})

MovieInfo.displayName = "MovieInfo"
export default MovieInfo