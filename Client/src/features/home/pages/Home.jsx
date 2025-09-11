import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Col, Input, Row, Card, Button, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import moment from "moment";
import Meta from "antd/es/card/Meta";
import { getMoviesRequest, selectMovie, selectMovieError, selectMovieLoading } from "../../../redux/slices/movieSlice";
import { notify } from "../../../utils/notificationUtils";
import { useAuth } from "../../../hooks/useAuth";

const MovieCard = React.memo(({ movie, onMovieClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError= useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, [])

  return(
    <Col key={movie._id} xs={24} sm={12} md={8} lg={6} xl={4}>
      <Card 
        hoverable
        style={{ width: '100%', minHeight: "400px", transition: "transform 0.2s ease-in-out"}}
        cover={
          <div
            style={{
              height: "320px",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#f5f5f5", // Placeholder background
            }}
          >
            { !imageLoaded && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#ccc",
                }}
              >
                <Spin size="small" />
              </div>
            )}
            <img 
              alt={`${movie.movieName} poster`}
              src={imageError ? "/placeholder.svg?height=320&width=240&query=movie poster" : movie.poster} 
              style={{ 
                height: "320px",
                width: "100%", 
                objectFit: "cover", 
                borderTopLeftRadius: "8px", 
                borderTopRightRadius: "8px",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
              }}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
              decoding="async"
            />
          </div>
        }
        onClick = {() => onMovieClick(movie._id)}
      >
        <Meta 
          title={
            <div 
              style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  minHeight: "24px", // Prevent layout shift
                }}
              >
              {movie.movieName}
            </div>
          } 
          description = {
            <div
              style={{
                fontSize: "0.85rem",
                color: "#888",
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                minHeight: "20px", // Prevent layout shift
              }}
            >
              {movie.genre.join("/") || "Genre not available"}
            </div>
          }
        />
      </Card>
    </Col>  
  )
})

MovieCard.displayName ="MovieCard"

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const Home = () => {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300) // 300ms debounce
  const { user } = useAuth();  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectMovieLoading);
  const movieError = useSelector(selectMovieError)
  const movies = useSelector(selectMovie);

  useEffect(() => {
    dispatch(getMoviesRequest());
  }, [dispatch])

  const handleSearch = useCallback((event) => {
    setSearchText(event.target.value);
  }, [])

  const handleMovieClick = useCallback(
    (movieId) => {
      if (!user) 
      {
        notify("warning", "Please log in to view movie details.")
        return
      }

      if(user?.role === "user")
        {
          const targetPath = `/movie/${movieId}/${moment().format("YYYYMMDD")}`
          navigate(targetPath);
        }
        else
        {
          notify("warning", "Only users can view movie details.");
        } 
    }, 
    [user, navigate]
  )

  const filteredMovies = useMemo(() => {
    if(!movies) return [];
    if(!debouncedSearchText.trim()) return movies

    const searchLower = debouncedSearchText.toLowerCase();
    return movies.filter(
      (movie) => 
        movie.movieName.toLowerCase().includes(searchLower) ||
        movie.genre?.some((g) => g.toLowerCase().includes(searchLower)),
    );
  }, [movies, debouncedSearchText])

  const LoadingComponent = useMemo(
    () => (
      <div
        className="loader-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <Spin size="large" />
      </div>
    ),
    [],
  )
    
  if (loading) {
        return LoadingComponent
    }

    if(movieError){
        notify("error", "Sorry, something went wrong", movieError);
    }
  
  return (
    <>
      <Row justify="center" style={{ padding: "20px 15px", minHeight: "80px"}}>
        <Col xs={24} lg={12}>
          <Input.Search 
            placeholder="Type here to search for movies"
            onChange={handleSearch}
            value={searchText}
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

      <Row style={{ marginBottom: "16px", minHeight: "60px"}}>
        <Col span={24}>
          <Title level={3} style={{ textAlign: "left", paddingLeft: 20, margin: 0}}>
            { debouncedSearchText ? `Search Results (${filteredMovies.length})` : "Recommended Movies" }
          </Title>
        </Col>
      </Row>
       
      <Row gutter={[16, 24]} style={{ padding: "0 20px", minHeight: "400px" }} justify="start">
        {
          filteredMovies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} onMovieClick={handleMovieClick}/>
          ))
        }
        {
          filteredMovies.length === 0 && debouncedSearchText && (
            <Col span={24}>
              <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                No movies found matching "{debouncedSearchText}"
              </div>
            </Col>
          )
        }
      </Row>
              
    </>

  )
}

export default Home