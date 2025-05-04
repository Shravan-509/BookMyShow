import React, { useEffect, useState } from 'react';
import {useDispatch} from "react-redux";
import { Button, message, Table, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice';

import { getTheatres } from '../../../api/theatre';
import TheatreForm from './TheatreForm';
import DeleteTheatre from './DeleteTheatre';
import MovieShows from './MovieShows';

const TheatreList = () => {
    const [theatres, setTheatres] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isShowModalOpen, setIsShowModalOpen] = useState(false);
    const [selectedTheatre, setSelectedTheatre] = useState(null);
    const [formType, setFormType] = useState("add");

    const dispatch = useDispatch();

    const columns= [
        {
            title: "Name",
            key : "name",
            dataIndex: "name",
            render : (text) => <strong>{text}</strong>
        },
        {
            title: "Address",
            key : "address",
            dataIndex: "address",
            render: (address) => (
                <Tooltip title={address}>
                  <span>{address.length > 50 ? address.slice(0, 50) + "..." : address}</span>
                </Tooltip>
              )
        },
        {
            title: "Phone Number",
            key : "phone",
            dataIndex: "phone"
        },
        {
            title: "Email",
            key : "email",
            dataIndex: "email"
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
            }
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
                            <Button size="large"
                                onClick={() => {
                                    setIsShowModalOpen(true);
                                    setSelectedTheatre(data);
                                }}
                            >
                                + Shows
                            </Button>}
                    </div>
                )
            }
        }


    ]

    const getData = async () => {
        try {
            dispatch(showLoading());
            const response = await getTheatres();
            if(response?.success){
                setTheatres(response?.data);
            }
            else
            {
                message.warning(response?.message);
            }

        } catch (error) {
            message.error(error);
            
        }finally{
            dispatch(hideLoading());
        }
    }

    useEffect(() => {
        getData();
    }, [])
  return (
    <div style={{ borderRadius: "8px", padding: "5px" }}>
        <div className='flex justify-end mb-4'> 
            <Button type="primary" size="large"
                onClick={() => {
                    setIsModalOpen(true);
                    setFormType("add");
                }}
            >
                Add Theatre
            </Button>
        </div>
        <Table dataSource={theatres} columns={columns}/>
        {
            isModalOpen && 
                <TheatreForm 
                    isModalOpen={isModalOpen} 
                    setIsModalOpen={setIsModalOpen}
                    fetchTheatreData = {getData}
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
                    fetchTheatreData = {getData}
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