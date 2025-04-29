import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Col, Input, message, Row } from "antd";
import { hideLoading, showLoading } from "../redux/loaderSlice";
import { getMovies } from "../api/movie";
import Title from "antd/es/typography/Title";
import moment from "moment";

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [searchText, setSearchText] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.user);
  
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

  return (
    <div className="mt-3 ms-3">
      <Row className="justify-content-center w-100" style={{padding:"20px 15px 20px 0px"}}>
        <Col xs={{span: 24}} lg={{span: 12}}>
          <Input.Search  placeholder="Type here to search for movies"
            onChange={handleSearch}
            enterButton
            
          />
        </Col>
      </Row>
      <Title level={3}>Recommended Movies</Title>
      <Row className="justify-content-center" gutter={{xs:8, sm:16, md:24, lg:32}}>
        {
          movies && 
            movies.filter((movie) => movie.movieName.toLowerCase().includes(searchText.toLowerCase()))
            .map((movie) => (
            <Col className="gutter-row mb-5" key={movie._id} span={{xs:24, sm:24, md:12, lg:10}}>
              <div className="text-center">
                <img 
                  src={movie.poster}
                  alt="Movie Poster"
                  width={200}
                  height={300}
                  className="cursor-pointer"
                  style={{
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.3s",
                    objectFit: "cover",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onClick={() => {
                    navigate(`/movie/${movie._id}/${moment().format("YYYYMMDD")}`)
                  }}
                />
                <Title level={4}  className="cursor-pointer"
                   onClick={() => {
                    navigate(`/movie/${movie._id}/${moment().format("YYYYMMDD")}`)
                  }}
                >
                  {movie.movieName}
                </Title>
              </div>
            </Col>  
          ))
        }

      </Row>
    
   
    </div>

  )
}

export default Home