import React, { useEffect, useState } from "react";
import { Button, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Spin, Table, Tooltip } from "antd";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { addShowRequest, deleteShowRequest, getShowsByTheatreRequest, selectShow, selectShowError, selectShowLoading, updateShowRequest } from "../../../redux/slices/showSlice";
import { getMoviesRequest, selectMovie } from "../../../redux/slices/movieSlice";
import { notify } from "../../../utils/notificationUtils";

const MovieShows = ({
    isShowModalOpen,
    setIsShowModalOpen,
    selectedTheatre,
    setSelectedTheatre
}) => {

    const [view, setView] = useState("table");
    const [selectedShow, setSelectedShow] = useState(null);

    const dispatch = useDispatch();
    const loading = useSelector(selectShowLoading);
    const showError = useSelector(selectShowError);
    const shows = useSelector(selectShow);
    const movies = useSelector(selectMovie);

    useEffect(() =>{
        dispatch(getShowsByTheatreRequest(selectedTheatre._id))
    }, [dispatch])

    useEffect(() => {
        if (!loading && shows && (view === "add" || view === "edit")) 
        {
            const timeoutId = setTimeout(() => {
                setView("table");
                setSelectedShow(null);
            }, 0);

            // Cleanup if the component unmounts before timeout
            return () => clearTimeout(timeoutId);
        }
    }, [loading, shows, view]);

    const handleCancel= () => {
        setIsShowModalOpen(false);
        setSelectedTheatre(null);
    };

    const onFinish =  (values) => {
        const show = {
            ...values,
            theatre: selectedTheatre._id
        };
        if(view === "add")
        {
            dispatch(addShowRequest(show))
        }
        else if(view === "edit")
        {
            dispatch(updateShowRequest({ id: selectedShow._id, show}));
        }
    }

    const handleDelete = (showId) => {
        dispatch(deleteShowRequest({ showId: showId, theatreId: selectedTheatre._id }));
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
                    <div className= "flex items-center gap-3">
                        <Tooltip title="Edit Show">
                            <Button size="large"
                                onClick={() => {
                                    setView("edit");
                                    setSelectedShow({
                                        ...data,
                                        date: moment(data.date).format("YYYY-MM-DD"),
                                        movie: data.movie._id
                                    });
                                    dispatch(getMoviesRequest());
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
                                <Button size="large" danger>
                                    <DeleteOutlined/>
                                </Button>
                            </Tooltip>
                        </Popconfirm>
                    </div>
                )
            }
        }
    ]

    if (loading) {
        return (
          <div className="loader-container">
            <Spin size='large'/>
          </div>
        )
    }

    if(showError){
        notify("error", "Sorry, something went wrong", showError);
    }

  return (
    <Modal
        centered
        title={selectedTheatre.name}
        open={isShowModalOpen}
        onCancel={handleCancel}
        width={1200}
        footer={null}
    >
        <div className="flex justify-between mb-4">
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
                    size="large"
                    type="primary"
                    className='bg-[#f84464]! hover:bg-[#dc3558]!'
                    onClick={() => {
                            setView("add");
                            dispatch(getMoviesRequest());
                        }
                    } 
                >
                    Add Show
                </Button>
            }
        </div>

        {
            view === "table" && <Table dataSource={shows} columns={columns} scroll={{ x: 600 }}/>
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
                                className="block"
                                rules={[{required: true, message: "Show Name is required"}]}
                            >
                                <Input size="large" id="name" type="text" placeholder="Show Name"></Input>

                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Show Date"
                                name="date"
                                htmlFor="date"
                                className="block"
                                rules={[{required: true, message: "Show Date is required"}]}
                            >
                                <Input id="date" type="date" size="large" placeholder="Show Date"></Input>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Show Timing"
                                htmlFor="time"
                                name="time"
                                className="block"
                                rules={[{required: true, message: "Show Time is required"}]}
                            >
                                <Input id="time" type="time" size="large" placeholder="Show Time"></Input>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                        <Col span={8}>
                            <Form.Item
                                label="Select the Movie"
                                name="movie"
                                htmlFor="movie"
                                className="block"
                                rules={[{required: true, message: "Movie is required"}]}
                            >
                               <Select
                                id= "movie"
                                name= "movie"
                                size="large"
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
                                className="block"
                                rules={[{required: true, message: "Ticket Price is required"}]}
                            >
                                <InputNumber min={20} style={{ width: '100%' }}  suffix="Rs" id="ticketPrice" size="large" placeholder="Ticket Price"/>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Total Seats"
                                htmlFor="totalSeats"
                                name="totalSeats"
                                className="block"
                                rules={[{required: true, message: "Total Seats are required"}]}
                            >
                                <InputNumber min={10} style={{ width: '100%' }} id="totalSeats" size="large" placeholder="Total number of Seats"/>
                            </Form.Item>
                        </Col>
                    </Row>
                   
                    <div className="flex gap-3">
                        <Button size="large"
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
                        <Button size="large"
                                block
                                type="primary"
                                htmlType="submit"
                                className='bg-[#f84464]! hover:bg-[#dc3558]! text-base!'
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