import React, { useEffect, useState } from 'react';
import {useDispatch, useSelector} from "react-redux";
import { Button, Spin, Table, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import TheatreForm from './TheatreForm';
import DeleteTheatre from './DeleteTheatre';
import MovieShows from './MovieShows';
import { getTheatresRequest, selectTheatre, selectTheatreError, selectTheatreLoading } from '../../../redux/slices/theatreSlice';
import { notify } from '../../../utils/notificationUtils';

const TheatreList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isShowModalOpen, setIsShowModalOpen] = useState(false);
    const [selectedTheatre, setSelectedTheatre] = useState(null);
    const [formType, setFormType] = useState("add");

    const dispatch = useDispatch();
    const loading = useSelector(selectTheatreLoading);
    const theatreError = useSelector(selectTheatreError)
    const theatres = useSelector(selectTheatre);

    const columns= [
        {
            title: "Name",
            key : "name",
            dataIndex: "name",
            render : (text) => <strong>{text}</strong>,
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title: "Address",
            key : "address",
            dataIndex: "address",
            render: (address) => (
                <Tooltip title={address}>
                  <span>{address.length > 50 ? address.slice(0, 50) + "..." : address}</span>
                </Tooltip>
              ),
            responsive: ['md', 'lg', 'xl'],
        },
        {
            title: "Phone Number",
            key : "phone",
            dataIndex: "phone",
            responsive: ['lg', 'xl'],
        },
        {
            title: "Email",
            key : "email",
            dataIndex: "email",
            responsive: ['lg', 'xl'],
        },
        {
            title: "Status",
            key : "status",
            dataIndex: "isActive",
            render: (status, data) => {
                if(data.isActive){
                    return <Tag key={'approved'} color='green'>Approved</Tag>
                }
                else{
                    return <Tag key={'pending'} color='red'>Pending / Blocked</Tag>
                }
            },
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {
            title : "Actions",
            key: "actions",
            render : (text, data) => {
                return(
                    <div className= "flex gap-3">
                        <Tooltip title="Edit Theatre">
                            <Button size="large"
                                onClick={() => {
                                    setIsModalOpen(true);
                                    setSelectedTheatre(data);
                                    setFormType("edit");
                                }}
                            >
                                <EditOutlined/>
                            </Button>
                        </Tooltip>
                        <Tooltip  title={"Delete Theatre"}>
                            <Button danger size="large"
                                onClick={() => {
                                    setIsDeleteModalOpen(true);
                                    setSelectedTheatre(data);
                                }}
                            >
                                <DeleteOutlined/>
                            </Button>
                        </Tooltip>
                        {data.isActive && 
                            <Tooltip  title={"Add Shows"}>
                                <Button size="large"
                                    onClick={() => {
                                        setIsShowModalOpen(true);
                                        setSelectedTheatre(data);
                                    }}
                                >
                                    + Shows
                                </Button>
                            </Tooltip>
                        }
                    </div>
                )
            },
            responsive: ['xs', 'sm', 'md', 'lg', 'xl']
        }
    ]

    useEffect(() => {
        dispatch(getTheatresRequest());
    }, [dispatch])

    if (loading) {
        return (
          <div className="loader-container">
            <Spin size='large'/>
          </div>
        )
    }

    if(theatreError){
        notify("error", "Sorry, something went wrong", theatreError);
    }

  return (
    <div style={{ borderRadius: "8px", padding: "5px" }}>
        <div className='flex justify-end mb-4'> 
            <Button 
                type="primary" 
                size="large"
                className='bg-[#f84464]! hover:bg-[#dc3558]!'
                    onClick={() => {
                        setIsModalOpen(true);
                        setFormType("add");
                    }}
            >
                Add Theatre
            </Button>
        </div>
        <Table 
            dataSource={theatres} 
            columns={columns}
            scroll={{ x: 600 }}
        />
        {
            isModalOpen && 
                <TheatreForm 
                    isModalOpen={isModalOpen} 
                    setIsModalOpen={setIsModalOpen}
                    formType= {formType}
                    selectedTheatre={selectedTheatre}
                    setSelectedTheatre={setSelectedTheatre}
                />
        }
        {
            isDeleteModalOpen && 
                <DeleteTheatre
                    isDeleteModalOpen={isDeleteModalOpen} 
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    selectedTheatre={selectedTheatre}
                    setSelectedTheatre={setSelectedTheatre}
                />
        }
        {
            isShowModalOpen && 
            <MovieShows
                isShowModalOpen={isShowModalOpen} 
                setIsShowModalOpen={setIsShowModalOpen}
                selectedTheatre={selectedTheatre}
                setSelectedTheatre={setSelectedTheatre}
            />
        }
        
    </div>
  )
}

export default TheatreList