import React, { useEffect, useState } from 'react';
import { message, Tag, Tooltip, Table, Button } from 'antd';
import { useDispatch } from 'react-redux';
import { getTheatres, updateTheatre } from '../../api/theatre';
import { hideLoading, showLoading } from "../../redux/loaderSlice";

const TheatreList = () => {
  const [theatres, setTheatres] = useState([]);
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
        title: "Owner",
        key: "owner",
        dataIndex: "owner",
        render : (text, data) => {return data.owner && data.owner.name }
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
          title : "Action",
          key: "action",
          dataIndex: "action",
          render : (text, data) => {
              return(
                      <div className='d-flex align-items-center gap-10'>
                        {
                          data.isActive ? (
                            <Button onClick={() =>  handleStatusChange(data)}>Block</Button> 
                          ) : (
                            <Button onClick={() =>  handleStatusChange(data)}>Approve</Button> 
                          )
                        }
                      </div>  
              )
          }
      }
  ]

  useEffect(() => {
    getData();
  }, [])

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

  const handleStatusChange = async(theatre) => {
    try {
      dispatch(showLoading());
      const updatedTheatre = {
        ...theatre,
        isActive: !theatre.isActive
      }
      const response = await updateTheatre(theatre._id, updatedTheatre);
      if(response?.success){
         message.success(response.message)
         getData();
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

return (
    <div style={{ borderRadius: "8px", padding: "5px" }}>
        <Table dataSource={theatres} columns={columns}/>      
    </div>
  )
}

export default TheatreList