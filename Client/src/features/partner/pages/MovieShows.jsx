import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Spin, Table, Tooltip } from "antd";
import Title from "antd/es/typography/Title";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { addShowRequest, deleteShowRequest, getShowsByTheatreRequest, selectShow, selectShowError, selectShowLoading, updateShowRequest } from "../../../redux/slices/showSlice";
import { getMoviesRequest, selectMovie } from "../../../redux/slices/movieSlice";
import { fetchScreensByTheatreRequest, selectActiveScreensByTheatre } from "../../../redux/slices/screenSlice";
import { notify } from "../../../utils/notificationUtils";
import { formatDate, formatParsedTime } from "../../../utils/dateFormatter";
import { getAvailableSeats, getResolvedTotalSeats } from "./showCapacityUtils";
import { SEAT_TYPES } from "../../../utils/ticketPricing";

const normalizeScreenId = (screen) => {
    const value = screen?._id || screen;
    return value ? String(value) : undefined;
};

const buildTicketPricingPayload = (ticketPricing = {}) => {
    const payload = {};

    Object.values(SEAT_TYPES).forEach((seatType) => {
        const value = Number(ticketPricing?.[seatType]);

        if (Number.isFinite(value) && value > 0) {
            payload[seatType] = value;
        }
    });

    return Object.keys(payload).length > 0 ? payload : undefined;
};

const MovieShows = ({
    isShowModalOpen,
    setIsShowModalOpen,
    selectedTheatre,
    setSelectedTheatre
}) => {

    const [view, setView] = useState("table");
    const [selectedShow, setSelectedShow] = useState(null);
    const [form] = Form.useForm();

    const dispatch = useDispatch();
    const loading = useSelector(selectShowLoading);
    const showError = useSelector(selectShowError);
    const shows = useSelector(selectShow);
    const movies = useSelector(selectMovie);
    const activeScreens = useSelector(selectActiveScreensByTheatre(selectedTheatre?._id));
    const selectedScreenId = normalizeScreenId(Form.useWatch("screen", form));
    const screenOptions = useMemo(() => activeScreens.map((screen) => ({
        key: normalizeScreenId(screen),
        value: normalizeScreenId(screen),
        label: `${screen.name} (${screen.capacity} seats)`,
    })), [activeScreens]);
    const selectedScreen = activeScreens.find((screen) => normalizeScreenId(screen) === selectedScreenId);

    useEffect(() =>{
        if (selectedTheatre?._id) {
             dispatch(getShowsByTheatreRequest(selectedTheatre._id))
             dispatch(fetchScreensByTheatreRequest({ theatreId: selectedTheatre._id, activeOnly: true }))
        }
    }, [dispatch, selectedTheatre?._id])

    useEffect(() => {
        if (view === "table") {
            form.resetFields();
            return;
        }

        if (view === "add") {
            form.resetFields();
        }

        if (view === "edit" && selectedShow) {
            form.setFieldsValue(selectedShow);
        }
    }, [form, selectedShow, view]);

    useEffect(() => {
        if (!["add", "edit"].includes(view) || activeScreens.length === 0) {
            return;
        }

        const currentScreenId = normalizeScreenId(form.getFieldValue("screen"));
        const validScreenSelected = activeScreens.some((screen) => normalizeScreenId(screen) === currentScreenId);

        if (currentScreenId && !validScreenSelected) {
            form.setFieldsValue({
                screen: view === "add" && activeScreens.length === 1
                    ? normalizeScreenId(activeScreens[0])
                    : undefined
            });
            return;
        }

        if (currentScreenId && form.getFieldValue("screen") !== currentScreenId) {
            form.setFieldsValue({ screen: currentScreenId });
            return;
        }

        if (view === "add" && !currentScreenId && activeScreens.length === 1) {
            form.setFieldsValue({ screen: normalizeScreenId(activeScreens[0]) });
        }
    }, [activeScreens, form, view]);

    const handleCancel= () => {
        setIsShowModalOpen(false);
        setSelectedTheatre(null);
    };

    const onFinish =  (values) => {
        const ticketPricing = buildTicketPricingPayload(values.ticketPricing);
        const show = {
            ...values,
            screen: normalizeScreenId(values.screen),
            theatre: selectedTheatre._id
        };

        if (ticketPricing) {
            show.ticketPricing = ticketPricing;
        } else {
            delete show.ticketPricing;
        }

        if(view === "add")
        {
            dispatch(addShowRequest(show))
        }
        else if(view === "edit")
        {
            dispatch(updateShowRequest({ id: selectedShow._id, show}));
        }

        // Move back only after submit
        setView("table");
        setSelectedShow(null);
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
            render: (text) => {
                return formatDate(text, "MMM do yyyy")
            } 
        },
        {
            title: "Show Time",
            key : "time",
            dataIndex: "time",
            render: (text) => {
                return formatParsedTime(text);
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
            title: "Screen",
            key : "screen",
            dataIndex: "screen",
            render: (screen) => screen?.name || "Legacy / Unassigned"
        },
        {
            title: "Ticket Price",
            key : "ticketPrice",
            dataIndex: "ticketPrice"
        },
        {
            title: "Total Seats",
            key : "totalSeats",
            render: (text, data) => getResolvedTotalSeats(data)
        },
        {
            title: "Available Seats",
            key : "seats",
            render: (text, data) => getAvailableSeats(data)
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
                                        date: formatDate(data.date, "yyyy-MM-dd"),
                                        movie: data.movie._id,
                                        screen: normalizeScreenId(data.screen)
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
            view === "table" && <Table rowKey="_id" dataSource={shows} columns={columns} scroll={{ x: 600 }}/>
        }

        {
            (view === "add" || view === "edit") && (
                <Form 
                    form={form}
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
                        <Col span={24}>
                            {activeScreens.length === 0 && (
                                <Alert
                                    showIcon
                                    type="warning"
                                    className="mb-4"
                                    title="No screens are configured for this theatre. Add a screen before creating a new show."
                                />
                            )}
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Select Screen"
                                name="screen"
                                htmlFor="screen"
                                className="block"
                                rules={[{required: true, message: "Screen is required for new show setup"}]}
                            >
                               <Select
                                id= "screen"
                                name= "screen"
                                size="large"
                                className="custom-select"
                                placeholder= "Select Screen"
                                disabled={activeScreens.length === 0}
                                options={screenOptions}
                              />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            {selectedScreen && (
                                <Alert
                                    showIcon
                                    type="info"
                                    title={`Screen: ${selectedScreen.name}`}
                                    description={`Capacity: ${selectedScreen.capacity} seats`}
                                />
                            )}
                        </Col>
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
                                label="Base Ticket Price"
                                name="ticketPrice"
                                htmlFor="ticketPrice"
                                className="block"
                                rules={[{required: true, message: "Ticket Price is required"}]}
                            >
                                <InputNumber min={20} style={{ width: '100%' }}  suffix="Rs" id="ticketPrice" size="large" placeholder="Ticket Price"/>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Title level={5} className="mt-2! mb-3!">
                        Seat Type Pricing
                    </Title>
                    <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Standard Price"
                                name={["ticketPricing", SEAT_TYPES.STANDARD]}
                                htmlFor="standardPrice"
                                className="block"
                            >
                                <InputNumber min={20} style={{ width: '100%' }} suffix="Rs" id="standardPrice" size="large" placeholder="Uses base price if empty" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Premium Price"
                                name={["ticketPricing", SEAT_TYPES.PREMIUM]}
                                htmlFor="premiumPrice"
                                className="block"
                            >
                                <InputNumber min={20} style={{ width: '100%' }} suffix="Rs" id="premiumPrice" size="large" placeholder="Uses base price if empty" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Recliner Price"
                                name={["ticketPricing", SEAT_TYPES.RECLINER]}
                                htmlFor="reclinerPrice"
                                className="block"
                            >
                                <InputNumber min={20} style={{ width: '100%' }} suffix="Rs" id="reclinerPrice" size="large" placeholder="Uses base price if empty" />
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
                                disabled={activeScreens.length === 0}
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
