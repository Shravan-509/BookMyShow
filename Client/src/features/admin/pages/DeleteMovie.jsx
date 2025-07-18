import { Modal } from 'antd'
import React from 'react'
import { useDispatch } from 'react-redux';
import { deleteMovieRequest } from '../../../redux/slices/movieSlice';

const DeleteMovie = ({
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    selectedMovie,
    setSelectedMovie
}) => {

    const dispatch = useDispatch();

    const handleOk = () => {   
        dispatch(deleteMovieRequest(selectedMovie._id))   
        
        setIsDeleteModalOpen(false);
        setSelectedMovie(null);
    }

    const handleCancel = () => {
        setIsDeleteModalOpen(false);
        setSelectedMovie(null);
    }

  return (
    
    <Modal
        title="Delete Movie?"
        open={isDeleteModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{
            className: '!bg-[#f84464] hover:!bg-[#dc3558] !text-white'
        }}
        cancelButtonProps={{
            className: 'hover:!border-[#f84464] !text-gray-600 hover:!text-black'
        }}   
    >
        <p className='pt-3 fs-18'>
            Are you sure, you want to delete this movie <strong>{selectedMovie.movieName}</strong> ?
        </p>
        <p className='pb-3 fs-18'>
           This action can't be undone and you'll lose this movie data.
        </p>
    </Modal>
    
  )
}

export default DeleteMovie