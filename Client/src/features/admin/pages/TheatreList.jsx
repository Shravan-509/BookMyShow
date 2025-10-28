import React, { useEffect } from 'react';
import { Tag, Tooltip, Table, Button, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { getTheatresRequest, selectTheatre, selectTheatreError, selectTheatreLoading, updateTheatreRequest } from '../../../redux/slices/theatreSlice';
import { notify } from '../../../utils/notificationUtils';

const TheatreList = () => {
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
          responsive: ['md', 'lg', 'xl']
      },
      {
        title: "Owner",
        key: "owner",
        dataIndex: "owner",
        render : (text, data) => {return data.owner && data.owner.name },
        responsive: ['xs', 'sm', 'md', 'lg', 'xl']
      },
      {
          title: "Phone Number",
          key : "phone",
          dataIndex: "phone",
          responsive: ['xs', 'sm', 'md', 'lg', 'xl']
      },
      {
          title: "Email",
          key : "email",
          dataIndex: "email",
          responsive: ['md', 'lg', 'xl']
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
          title : "Action",
          key: "action",
          dataIndex: "action",
          render : (text, data) => {
              return(
                      <div className='flex align-items-center gap-3'>
                        {
                          data.isActive ? (
                            <Button 
                              onClick={() =>  handleStatusChange(data)}
                              className= 'hover:border-[#f84464]! text-gray-600! hover:text-black!'
                        
                            >
                              Block
                            </Button> 
                          ) : (
                            <Button 
                              onClick={() =>  handleStatusChange(data)}
                              className= 'hover:border-[#f84464]! text-gray-600! hover:text-black!'
                        
                            >
                                Approve
                            </Button> 
                          )
                        }
                      </div>  
              )
          },
          responsive: ['xs', 'sm', 'md', 'lg', 'xl']
      }
  ]

  useEffect(() => {
    dispatch(getTheatresRequest())
  }, [dispatch])

  const handleStatusChange = (theatre) => {
     
      const updatedTheatre = {
        ...theatre,
        isActive: !theatre.isActive
      }
      dispatch(updateTheatreRequest({id:theatre._id, theatre: updatedTheatre}));
  }
  
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
        <Table 
          dataSource={theatres} 
          columns={columns}
          scroll={{ x: 600 }}
        />      
    </div>
  )
}

export default TheatreList