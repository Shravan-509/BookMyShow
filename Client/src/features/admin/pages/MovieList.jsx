import React, { useEffect, useState } from 'react';
import { Button, Spin, Table, Tag, Tooltip } from 'antd'
import moment from 'moment';
import {useDispatch, useSelector} from "react-redux";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import MovieForm from './MovieForm';
import DeleteMovie from './DeleteMovie';
import { getMoviesRequest, selectMovie, selectMovieError, selectMovieLoading } from '../../../redux/slices/movieSlice';
import { notify } from '../../../utils/notificationUtils';

const MovieList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [formType, setFormType] = useState("add");
    const dispatch = useDispatch();

    const loading = useSelector(selectMovieLoading);
    const movieError = useSelector(selectMovieError)
    const movies = useSelector(selectMovie);

    const renderTagGroup = (items, max = 3, color = "blue") => {
        if (items.length <= max) {
          return items.map((item) => (
            <Tag key={item} color={color}>
              {item}
            </Tag>
          ));
        }
        const visible = items.slice(0, max);
        const hidden = items.slice(max);
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
                {visible.map((item) => (
                <Tag key={item} color={color}>
                    {item}
                </Tag>
                ))}
                <Tooltip title={hidden.join(", ")}>
                <Tag color={color}>+{hidden.length}</Tag>
                </Tooltip>
            </div>
        );
      };
    
      const tableHeadings = [
        {
            title: "Poster",
            key : "poster",
            dataIndex: "poster",
            render : (text, data) => {
                return (
                    <img 
                        src={data?.poster}
                        alt="Movie Poster"
                        style={{objectFite: "cover", borderRadius: 4 }}
                        width="80"
                        
                    />
                )
            },
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title: "Movie Name",
            key : "movieName",
            dataIndex: "movieName",
            render : (text) => <strong>{text}</strong>,
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title: "Description",
            key : "description",
            dataIndex: "description",
            render: (description) => (
                <Tooltip title={description}>
                  <span>{description.length > 50 ? description.slice(0, 50) + "..." : description}</span>
                </Tooltip>
              ),
            responsive: ['md', 'lg', 'xl']
        },
        {
            title: "Duration",
            key : "duration",
            dataIndex: "duration",
            render : (text) => `${text} Min`,
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title: "Genre",
            key : "genre",
            dataIndex: "genre",
            render: (genres) => renderTagGroup(genres, 3, "geekblue"),
            responsive: ['md', 'lg', 'xl']
        },
        {
            title: "Language",
            key : "language",
            dataIndex: "language",
            render: (langs) => renderTagGroup(langs, 3, "volcano"),
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title: "Release Date",
            key : "releaseDate",
            dataIndex: "releaseDate",
            render : (text, data) => {
                return moment(data.releaseDate).format("DD-MM-YYYY")
            },
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title : "Actions",
            key: "actions",
            render : (text, data) => {
                return(
                    <div className= "flex gap-3">
                        <Tooltip title="Edit Movie">
                            <Button size='large'
                                onClick={() => {
                                    setIsModalOpen(true);
                                    setSelectedMovie(data);
                                    setFormType("edit");
                                }}
                            >
                                <EditOutlined/>
                            </Button>
                        </Tooltip>
                        <Tooltip  title={"Delete Movie"}>
                            <Button danger size='large'
                                onClick={() => {
                                    setIsDeleteModalOpen(true);
                                    setSelectedMovie(data);
                                }}
                            >
                                <DeleteOutlined/>
                            </Button>
                        </Tooltip>
                    </div>
                )
            },
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        }
    ]

    useEffect(() => {
        // Fetch all the movies
        dispatch(getMoviesRequest());
    }, [dispatch])

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
   <div style={{ borderRadius: "8px", padding: "5px" }}>
        <div className='flex justify-end mb-4'> 
            <Button 
                type="primary" 
                size='large'
                className='bg-[#f84464]! hover:bg-[#dc3558]!'
                onClick={() => {
                    setIsModalOpen(!isModalOpen);
                    setFormType("add");
                }}
            >
                Add Movie
            </Button>
        </div>
        <Table 
            columns={tableHeadings} 
            dataSource={movies}
            scroll={{ x: 600 }}
            rowKey={(record) => record._id}
        />
        {
            isModalOpen && 
                <MovieForm 
                    isModalOpen={isModalOpen} 
                    setIsModalOpen={setIsModalOpen}
                    formType= {formType}
                    selectedMovie={selectedMovie}
                    setSelectedMovie={setSelectedMovie}

                />
        }
        {
            isDeleteModalOpen && 
                <DeleteMovie 
                    isDeleteModalOpen={isDeleteModalOpen} 
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    selectedMovie={selectedMovie}
                    setSelectedMovie={setSelectedMovie}
                />
        }
   </div>
  )
}

export default MovieList