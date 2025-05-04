import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Col, Input, message, Row, Card, Carousel, Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { hideLoading, showLoading } from "../../../redux/slices/loaderSlice";
import { getMovies } from "../../../api/movie";
import Title from "antd/es/typography/Title";
import moment from "moment";
import Meta from "antd/es/card/Meta";

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [searchText, setSearchText] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
 
    
  const getData = async () => {
    try {
      dispatch(showLoading());
      const response = await getMovies();
      
      if(response?.success)
      {
        setMovies(response?.data);
      }
      else{
        message.warning(response?.message)
      }
      
    } catch (error) {
      message.error(error);
      
    } finally{
      dispatch(hideLoading())
    }
  }

  useEffect(() => {
    getData();
  }, [])

  const handleSearch = (event) => {
    setSearchText(event.target.value);
  }

  const filteredMovies = 
    movies?.filter((movie) =>
      movie.movieName.toLowerCase().includes(searchText.toLowerCase())) || [];
  

  return (
    <>
      <Row justify="center" style={{ padding: "20px 15px" }}>
        <Col xs={24} lg={12}>
          <Input.Search 
            placeholder="Type here to search for movies"
            onChange={handleSearch}
            enterButton
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
                onClick = {() => { navigate(`/movie/${movie._id}/${moment().format("YYYYMMDD")}`)}}
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