import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Col, Input, message, Row, Card, Button, Result, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import moment from "moment";
import Meta from "antd/es/card/Meta";
import { getMoviesRequest, selectMovie, selectMovieError, selectMovieLoading } from "../../../redux/slices/movieSlice";
import { notify } from "../../../utils/notificationUtils";
import { useAuth } from "../../../hooks/useAuth";

const Home = () => {
  // const [movies, setMovies] = useState([]);
  const [searchText, setSearchText] = useState("");
  const {user} = useAuth();  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectMovieLoading);
  const movieError = useSelector(selectMovieError)
  const movies = useSelector(selectMovie);

  useEffect(() => {
    dispatch(getMoviesRequest());
  }, [dispatch])

  const handleSearch = (event) => {
    setSearchText(event.target.value);
  }

  const filteredMovies = 
    movies?.filter((movie) =>
      movie.movieName.toLowerCase().includes(searchText.toLowerCase())) || [];
  
  if (loading) {
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
      <Row justify="center" style={{ padding: "20px 15px" }}>
        <Col xs={24} lg={12}>
          <Input.Search 
            placeholder="Type here to search for movies"
            onChange={handleSearch}
            enterButton= {
              <Button
                icon={<SearchOutlined className="!text-white" />}
                className="!bg-[#f84464] hover:!bg-[#dc3558] !text-white !border-none"
              />
            }
            size="large"
            allowClear
          />
        </Col>
      </Row>
      <Row style={{ marginBottom: "16px" }}>
        <Col span={24}>
          <Title level={3} style={{ textAlign: "left", paddingLeft: 20 }}>Recommended Movies</Title>
        </Col>
      </Row>
       
      <Row gutter={[16, 24]} style={{ padding: "0 20px" }} justify="start">
        {
          filteredMovies.map((movie) => (
            <Col 
              key={movie._id}  
              xs={24} 
              sm={12} 
              md={8} 
              lg={6} 
              xl={4}
            >
              <Card 
                hoverable
                style={{ width: '100%', minHeight: 300 }}
                cover={
                  <img 
                    alt="Movie Poster" 
                    src={movie.poster} 
                    style={{ height: 320, objectFit: "cover", borderTopLeftRadius: "8px", borderTopRightRadius: "8px"}}
                  />
                }
                onClick = {() => { 
                  if(user?.role === "user")
                  {
                    navigate(`/movie/${movie._id}/${moment().format("YYYYMMDD")}`)
                  }
                  else
                  {
                    message.warning("Only users can view movie details.");
                  }                  
                }}
              >
                <Meta 
                  title={
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {movie.movieName}
                    </div>} 
                  description = {
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#888",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}
                    >
                      {movie.genre.join("/")}
                    </div>
                  }
                />
              </Card>
            </Col>  
        ))}
      </Row>
              
    </>

  )
}

export default Home