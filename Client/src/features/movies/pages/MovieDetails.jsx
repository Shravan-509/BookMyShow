import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { Button, Card, Col, message, Rate, Result, Row, Space, Spin, Tabs, Tag, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, InfoCircleOutlined, PlayCircleOutlined, TeamOutlined } from '@ant-design/icons';
const { Title, Paragraph } = Typography;
import moment from "moment";
import { formatDuration } from '../../../utils/format-duration';

import ShowTime from './ShowTime';
import MovieSynopsis from "./MovieSynopsis";
import { getMovieByIdRequest, selectMovieError, selectMovieLoading, selectSelectedMovie } from '../../../redux/slices/movieSlice';
import { notify } from '../../../utils/notificationUtils';

const MovieInfo = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState("showTimes")

    const movieLoading = useSelector(selectMovieLoading);
    const movieError = useSelector(selectMovieError)
    const movie = useSelector(selectSelectedMovie);

    useEffect(() => {
        dispatch(getMovieByIdRequest(params.id))
    }, [dispatch])

    // Define tab items
    const items = [
        {
            key: "showTimes",
            label: <span className="flex items-center gap-2">
                        <CalendarOutlined/>
                        Show Times
                    </span>,
            children:<ShowTime />
        },
        {
            key: "about",
            label: <span className="flex items-center gap-2">
                        <InfoCircleOutlined />
                        About
                    </span>,
            children: <MovieSynopsis movie={movie} />
        },
        {
            key: "cast",
            label: <span className="flex items-center gap-2">
                        <TeamOutlined />
                        Cast & Crew
                    </span>,
            children:  <Card>
                        <Title level={4} style={{ marginTop: 0 }}>
                            Cast
                        </Title>
                    </Card>
        }
    ]

    if (!movie) {
        return (
          <div className="loader-container">
            <Spin size='large'/>
          </div>
        )
    }

    if(movieError){
        notify("error", "Sorry, something went wrong", movieError);
    }
    
  return (
    <>
        <div
            className="movie-banner"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${movie.poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: "60px 0",
                color: "white",
            }}
        >
            <div className="inner-container">
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} sm={8} md={6} lg={5}>
                        <div className="poster-container">
                            <img
                                alt={movie.title}
                                src={movie.poster || "/placeholder.svg"}
                                style={{
                                    width: "100%",
                                    height: 320,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                                }}
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={16} md={18} lg={19}>
                        <Title level={1} style={{ color: "white", marginTop: 0, marginBottom: 8 }}>
                            {movie.title}
                        </Title>

                        <Space size={16} className="!mb-4">
                            <Rate disabled defaultValue={4.5} allowHalf style={{ fontSize: 16 }} />
                            <Typography style={{ color: "white" }}>4.5/5</Typography>

                            <span style={{ display: "flex", alignItems: "center" }}>
                                <ClockCircleOutlined style={{ marginRight: 8 }} />
                                <Typography style={{ color: "white" }}>{formatDuration(movie.duration)}</Typography>
                            </span>
                        </Space>

                        <div className="mb-4">
                            {movie.genre.map((g) => (
                            <Tag key={g} color="blue" style={{ marginRight: 8, marginBottom: 8 }}>
                                {g}
                            </Tag>
                            ))}
                        </div>

                        <div className="mb-4">
                            {movie.language.map((lang) => (
                            <Tag key={lang} color="volcano" style={{ marginRight: 8, marginBottom: 8 }}>
                                {lang}
                            </Tag>
                            ))}
                        </div>

                        <Paragraph style={{ color: "#e6e6e6", marginBottom: 16 }}>
                            <CalendarOutlined style={{ marginRight: 8 }} />
                            Release: {moment(movie.releaseDate).format("DD MMM, YYYY")}
                        </Paragraph>

                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<PlayCircleOutlined />} 
                            className='!bg-[#f84464] hover:!bg-[#dc3558] mr-4'
                        >
                            Watch Trailer
                        </Button>
                    </Col>
                </Row>
            </div>
        </div>

        {/* Main Content Section */}
        <div className='inner-container' style={{paddingTop: "40px 0"}}>
            <Tabs  
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                items={items}
                size='large' 
                style={{marginBottom: 32, marginTop: 20}}
            />  
        </div>
    </>
  )
}

export default MovieInfo