import React, { useEffect, useState } from 'react';
import {useDispatch} from "react-redux";
import { Button, message, Table, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { hideLoading, showLoading } from '../../redux/loaderSlice';

import { getTheatresByOwner } from '../../api/theatre';
import TheatreForm from './TheatreForm';
import DeleteTheatre from './DeleteTheatre';

const TheatreList = () => {
    const [theatres, setTheatres] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
                    <div className= "d-flex gap-10">
                        <Tooltip title="Edit Theatre">
                            <Button
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
                            <Button danger
                                onClick={() => {
                                    setIsDeleteModalOpen(true);
                                    setSelectedTheatre(data);
                                }}
                            >
                                <DeleteOutlined/>
                            </Button>
                        </Tooltip>
                    </div>
                )
            }
        }


    ]

    const getData = async () => {
        try {
            dispatch(showLoading());
            const response = await getTheatresByOwner();
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
        <div className='d-flex justify-content-end mb-3'> 
            <Button type="primary"
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
        
    </div>
  )
}

export default TheatreList