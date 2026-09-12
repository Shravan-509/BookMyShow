import React, { useEffect, memo, useState, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { Button, Card, Spin, Tabs, Tag, Typography, Alert, Skeleton } from 'antd';
import { 
    CalendarOutlined, 
    ClockCircleOutlined, 
    InfoCircleOutlined, 
    PlayCircleOutlined, 
    TeamOutlined,
    StarOutlined,
    CommentOutlined
} from '@ant-design/icons';
const { Title, Text } = Typography;
import { format, parseISO } from 'date-fns';
import { formatDuration } from '../../../utils/format-duration';
import BookingProgress from '../../../components/booking/BookingProgress';

const ShowTime = React.lazy(() => import("./ShowTime"));
const MovieSynopsis = React.lazy(() => import ("./MovieSynopsis"));
import { 
    getMovieByIdRequest, 
    selectMovieError, 
    selectMovieLoading, 
    selectSelectedMovie 
} from '../../../redux/slices/movieSlice';

const MovieInfo = memo(() => {
    const params = useParams();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState("showTimes")
    const [deviceType, setDeviceType] = useState('desktop')

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
            setDeviceType(getDeviceType(width))
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Computed responsive values
    const isMobile = deviceType === 'mobile'

    const formattedDuration = useMemo(() => {
        return movie?.duration ? formatDuration(movie.duration) : ""
    }, [movie?.duration])

    const movieTitle = useMemo(() => (
        movie?.movieName || movie?.title || "Movie"
    ), [movie?.movieName, movie?.title])

    const trailerUrl = useMemo(() => (
        movie?.trailerUrl || movie?.trailer
    ), [movie?.trailerUrl, movie?.trailer])

    const formattedReleaseDate = useMemo(() => {
        if (!movie?.releaseDate) return "";
        const d =
            typeof movie.releaseDate === "string"
            ? parseISO(movie.releaseDate)
            : new Date(movie.releaseDate);

        return format(d, "dd MMM, yyyy");
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

    const openTrailer = useCallback(() => {
        if (trailerUrl) {
            window.open(trailerUrl, "_blank", "noopener,noreferrer")
        }
    }, [trailerUrl])

    // Define tab items with responsive design
    const tabItems = useMemo(
        () => [
            {
                key: "showTimes",
                label: (
                    <span className="movie-tab-label">
                        <CalendarOutlined />
                        Showtimes
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
                    <span className="movie-tab-label">
                        <InfoCircleOutlined />
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
                    <span className="movie-tab-label">
                        <TeamOutlined />
                        Cast & Crew
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
            },
            {
                key: "reviews",
                label: (
                    <span className="movie-tab-label">
                        <CommentOutlined />
                        Reviews
                    </span>
                ),
                children: (
                    <Card className="movie-content-card">
                        <Title level={4} style={{ marginTop: 0 }}>
                            Reviews
                        </Title>
                        <div style={{ textAlign: "center", padding: isMobile ? "20px" : "40px" }}>
                            <Text type="secondary">
                                Reviews are not available for this movie yet.
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
                        title="Unable to Load Movie Details"
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
                        title="Movie Not Found"
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
            className="movie-hero"
            role="banner"
            aria-label={`${movieTitle} movie details`}
            style={{
                "--movie-poster-url": `url(${movie.poster || "/placeholder.svg"})`,
            }}
        >
            <div className="inner-container">
                <div className="movie-hero-content">
                    <div className="poster-container movie-hero-poster">
                        <img
                            alt={`${movieTitle} movie poster`}
                            src={movie.poster || "/placeholder.svg"}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    <div className="movie-hero-copy">
                        <Tag className="movie-status-tag">In Cinemas</Tag>
                        <Title level={1} className="movie-hero-title">
                            {movieTitle}
                        </Title>

                        <div className="movie-meta-line">
                            {movie.certification && <span>{movie.certification}</span>}
                            {formattedDuration && (
                                <span>
                                    <ClockCircleOutlined aria-hidden="true" />
                                    {formattedDuration}
                                </span>
                            )}
                            {movie.rating && (
                                <span>
                                    <StarOutlined aria-hidden="true" />
                                    {movie.rating}
                                </span>
                            )}
                            {formattedReleaseDate && (
                                <span>
                                    <CalendarOutlined aria-hidden="true" />
                                    {formattedReleaseDate}
                                </span>
                            )}
                        </div>

                        <div className="movie-chip-row">{genreTags}</div>
                        <div className="movie-chip-row">{languageTags}</div>

                        {trailerUrl && (
                            <Button
                                size="large"
                                icon={<PlayCircleOutlined />}
                                className="movie-trailer-button"
                                onClick={openTrailer}
                            >
                                Watch Trailer
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Section */}
        <div className='inner-container movie-booking-container'>
            <BookingProgress current="showtime" />
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
                type='line'
                className="movie-details-tabs"
                aria-label="Movie information tabs"
                role="tablist"
            />  
        </div>
    </>
  )
})

MovieInfo.displayName = "MovieInfo"
export default MovieInfo
