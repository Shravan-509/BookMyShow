import React, { useEffect, useState } from "react";
import { Button, Col, Form, Input, message, Modal, Popconfirm, Row, Select, Table, Tooltip } from "antd";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { hideLoading, showLoading } from "../../redux/loaderSlice";
import { addShow, deleteShow, getShowsByTheatre, updateShow } from "../../api/show";
import { getMovies } from "../../api/movie";

const MovieShows = ({
    isShowModalOpen,
    setIsShowModalOpen,
    selectedTheatre,
    setSelectedTheatre
}) => {

    const [view, setView] = useState("table");
    const [shows, setShows] = useState([]);
    const [movies, setMovies] = useState([]);
    const [selectedShow, setSelectedShow] = useState(null);
    const [isDeleteShowModalOpen, setIsDeleteShowModalOpen] = useState(false);

    const dispatch = useDispatch();

    useEffect(() =>{
        getData();
    }, [])

    const getData = async () => {
        try {
            dispatch(showLoading());

            // Get Shows By Theatre Id
            const showsResponse = await getShowsByTheatre(selectedTheatre._id);
            if(showsResponse?.success)
            {
                setShows(showsResponse.data);
            }
            else
            {
                message.warning(showsResponse.message);
            }

            // Get All Movies to Add shows
            const movieResponse = await getMovies();
            if(movieResponse?.success)
            {
                setMovies(movieResponse.data);
            }
            else{
                message.warning(showsResponse.message);
            }
            
        } catch (error) {
            message.error(error);
        } finally{
            dispatch(hideLoading());
        }
    }

    const handleCancel= () => {
        setIsShowModalOpen(false);
        setSelectedTheatre(null);
    };

    const onFinish = async (values) => {
        try {
            dispatch(showLoading());
            let response;
            if(view === "add")
            {
                response = await addShow({...values, theatre: selectedTheatre._id});
            }
            else if(view === "edit")
            {
                response = await updateShow(selectedShow._id, {...values, theatre: selectedTheatre._id})
            }

            if(response?.success)
            {
                getData();
                message.success(response.message);
                setView("table");
            }
            else{
                message.warning(response.message);
            }
            
        } catch (error) {
            message.error(error);
        }finally{
            dispatch(hideLoading());
        }
    }

    const handleDelete = async (showId) => {
        try {
            dispatch(showLoading());
            const response = await deleteShow(showId);
            if(response?.success)
            {
                message.success(response.message);
                getData();
            }
            else
            {
                message.warning(response.message);
            }
            
        } catch (error) {
            message.error(error);
        }finally{
            dispatch(hideLoading())
        }
    }

    const columns= [
        {
            title: "Show Name",
            key : "name",
            dataIndex: "name",
            render : (text) => <strong>{text}</strong>
        },
        {
            title: "Show Date",
            key : "date",
            dataIndex: "date",
            render: (text, data) => {
                return moment(text).format("MMM Do YYYY")
            } 
        },
        {
            title: "Show Time",
            key : "time",
            dataIndex: "time",
            render: (text, data) => {
                return moment(text, "HH:mm").format("hh:mm A")
            } 
        },
        {
            title: "Movie",
            key : "movie",
            dataIndex: "movie",
            render: (text, data) => {
                return <strong>{data.movie.movieName}</strong>
            } 
        },
        {
            title: "Ticket Price",
            key : "ticketPrice",
            dataIndex: "ticketPrice"
        },
        {
            title: "Total Seats",
            key : "totalSeats",
            dataIndex: "totalSeats"
        },
        {
            title: "Available Seats",
            key : "seats",
            render: (text, data) => {
                return data.totalSeats - data.bookedSeats.length;
            } 
        },
        {
            title : "Actions",
            key: "actions",
            render : (text, data) => {
                return(
                    <div className= "d-flex align-items-center gap-10">
                        <Tooltip title="Edit Show">
                            <Button
                                onClick={() => {
                                    setView("edit");
                                    setSelectedShow({
                                        ...data,
                                        date: moment(data.date).format("YYYY-MM-DD"),
                                        movie: data.movie._id
                                    });
                                }}
                            >
                                <EditOutlined/>
                            </Button>
                        </Tooltip>
                        <Popconfirm
                            title="Are you sure to delete this show?"
                            onConfirm={() => handleDelete(data._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip  title={"Delete Show"}>
                                <Button danger>
                                    <DeleteOutlined/>
                                </Button>
                            </Tooltip>
                        </Popconfirm>
                    </div>
                )
            }
        }
    ]

  return (
    <Modal
        centered
        title={selectedTheatre.name}
        open={isShowModalOpen}
        onCancel={handleCancel}
        width={1200}
        footer={null}
    >
        <div className="d-flex justify-content-between mb-3">
            <Title level={4}>
                {
                    view === "table" 
                        ? "List of Shows" 
                        : view === "add"
                        ? "Add Show"
                        : "Edit Show"
                }
            </Title>
            {
                view === "table" && 
                <Button 
                    type="primary"
                    onClick={() => {
                            setView("add");
                        }
                    } 
                >
                    Add Show
                </Button>
            }
        </div>

        {
            view === "table" && <Table dataSource={shows} columns={columns}/>
        }

        {
            (view === "add" || view === "edit") && (
                <Form 
                    layout="vertical" 
                    initialValues = {selectedShow} 
                    onFinish={onFinish}
                    style={{width: "100%"}}
                >
                    <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                        <Col span={8}>
                            <Form.Item
                                label="Show Name"
                                name="name"
                                htmlFor="name"
                                className="d-block"
                                rules={[{required: true, message: "Show Name is required!"}]}
                            >
                                <Input id="name" type="text" placeholder="Enter the Show Name"></Input>

                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Show Date"
                                name="date"
                                htmlFor="date"
                                className="d-block"
                                rules={[{required: true, message: "Show Date is required!"}]}
                            >
                                <Input id="date" type="date" placeholder="Enter the Show Date"></Input>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Show Timing"
                                htmlFor="time"
                                name="time"
                                className="d-block"
                                rules={[{required: true, message: "Show Time is required!"}]}
                            >
                                <Input id="time" type="time" placeholder="Enter the Show Time"></Input>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                        <Col span={8}>
                            <Form.Item
                                label="Select the Movie"
                                name="movie"
                                htmlFor="movie"
                                className="d-block"
                                rules={[{required: true, message: "Movie is required!"}]}
                            >
                               <Select
                                id= "movie"
                                name= "movie"
                                className="custom-select"
                                placeholder= "Select Movie"
                                options={movies.map((movie) => ({
                                        key: movie._id,
                                        value: movie._id,
                                        label: movie.movieName
                                    })
                                )}
                              />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Ticket Price"
                                name="ticketPrice"
                                htmlFor="ticketPrice"
                                className="d-block"
                                rules={[{required: true, message: "Ticket Price is required!"}]}
                            >
                                <Input id="ticketPrice" type="number" placeholder="Enter the Ticket Price"></Input>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Total Seats"
                                htmlFor="totalSeats"
                                name="totalSeats"
                                className="d-block"
                                rules={[{required: true, message: "Total Seats are required!"}]}
                            >
                                <Input id="totalSeats" type="Number" placeholder="Enter the total number of Seats"></Input>
                            </Form.Item>
                        </Col>
                    </Row>
                   
                    <div className="d-flex gap-10">
                        <Button
                            block
                            onClick={() => 
                                {
                                    setView("table");
                                    setSelectedShow(null);
                                }
                            }
                            htmlType="button"
                        >
                            <ArrowLeftOutlined/> Go Back
                        </Button>
                        <Button 
                                block
                                type="primary"
                                htmlType="submit"
                                style={{fontSize: "1rem", fontWeight: "600"}}
                            >
                                {view === "add" ? "Add Show" : "Update Show"}
                        </Button>
                    </div>                   
                </Form>    
            )
        }
    </Modal>
  )
}

export default MovieShows