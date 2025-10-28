import React from 'react'
import { useDispatch } from 'react-redux';
import { Modal } from 'antd';
import { deleteTheatreRequest } from '../../../redux/slices/theatreSlice';

const DeleteTheatre = ({ isDeleteModalOpen,
    setIsDeleteModalOpen,
    selectedTheatre,
    setSelectedTheatre
  }) => {

const dispatch = useDispatch();

const handleOk = () => {
    dispatch(deleteTheatreRequest(selectedTheatre._id))   
    setIsDeleteModalOpen(false);
    setSelectedTheatre(null);  
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
      okButtonProps={{
            className: 'bg-[#f84464]! hover:!bg-[#dc3558] !text-white'
        }}
        cancelButtonProps={{
            className: 'hover:!border-[#f84464] !text-gray-600 hover:!text-black'
        }}  
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