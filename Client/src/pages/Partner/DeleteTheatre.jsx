import React from 'react'
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../../redux/loaderSlice';
import { message, Modal } from 'antd';
import { deleteTheatre } from '../../api/theatre';

const DeleteTheatre = ({ isDeleteModalOpen,
    setIsDeleteModalOpen,
    fetchTheatreData,
    selectedTheatre,
    setSelectedTheatre
  }) => {

const dispatch = useDispatch();

const handleOk = async () => {
    try {
        dispatch(showLoading());
        const theatreId = selectedTheatre._id;
        const response = await deleteTheatre(theatreId);
        if(response?.success)
        {
            message.success(response.message);
            fetchTheatreData();
        }
        else{
            message.warning(response.message);
        }
        
    } catch (error) {
        message.error(error);
        
    }finally{
        setIsDeleteModalOpen(false);
        setSelectedTheatre(null);
        dispatch(hideLoading());
    }

}

const handleCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedTheatre(null);
}

return (
  <Modal
      title="Delete Theatre?"
      open={isDeleteModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
  >
      <p className='pt-3 fs-18'>
          Are you sure, you want to delete this theatre <strong>{selectedTheatre.name}</strong> ?
      </p>
      <p className='pb-3 fs-18'>
        This action can't be undone and you'll lose this theatre data.
      </p>
  </Modal>

)
}

export default DeleteTheatre