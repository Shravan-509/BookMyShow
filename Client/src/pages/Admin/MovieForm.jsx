import { Button, Col, Form, Input, message, Modal, Row, Select } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import React from 'react'
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../../redux/loaderSlice';
import { addMovie, updateMovie } from '../../api/movie';

const MovieForm = ({
    isModalOpen, 
    setIsModalOpen, 
    fetchMovieData, 
    formType, 
    selectedMovie, 
    setSelectedMovie
}) => {
   
    const dispatch = useDispatch();
   
    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedMovie(null);
    };

    const onFinish = async (values) => {
        try {
            dispatch(showLoading());
            let response = null;
            if(formType === "edit")
            {
                response = await updateMovie(selectedMovie._id, values);
            }
            else
            {
                response = await addMovie(values);
            }
            if(response?.success)
            {
                message.success(response.message);
                fetchMovieData();
            }
            else
            {
                message.warning(response?.message)
            }
        } catch (error) {
            message.error(error);
        }
        finally{
            setIsModalOpen(false);
            setSelectedMovie(null);
            dispatch(hideLoading());
        }
    }

  return (
    <div>
        <Modal 
            centered 
            title={formType === 'add' ? "Add Movie" : "Edit Movie"} 
            open={isModalOpen}
            onCancel={handleCancel}
            width={800}
        >
            <Form layout='vertical' initialValues= {selectedMovie} onFinish={onFinish}>
                <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                    <Col span={24}>
                        <Form.Item
                            label="Movie Name"
                            name="movieName"
                            rules={[{required: true, message: "Movie name is required!"}]}
                        >
                            <Input type='text' placeholder="Enter the movie name"></Input>

                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Description"
                            name="description"
                            rules={[{required: true, message: "Description is required!"}]}
                        >
                            <TextArea rows='4' placeholder="Enter the Description"></TextArea>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                            <Col span={12}>
                                <Form.Item
                                    label="Movie Duration (in min)"
                                    name="duration"
                                    rules={[{required: true, message: "Movie Duration is required!"}]}
                                >
                                    <Input type='number' placeholder="Enter the Movie Duration"></Input>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Release Date"
                                    name="releaseDate"
                                    rules={[{required: true, message: "Movie Release Date is required!"}]}
                                >
                                    <Input type='date'></Input>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                            <Col span={12}>
                                <Form.Item
                                    label="Select Movie Language"
                                    name="language"
                                    rules={[{required: true, message: "Movie Language is required!"}]}
                                >
                                    <Select 
                                        placeholder="Select Language"
                                        mode="multiple"
                                        className="custom-select"
                                        allowClear
                                        options={[
                                            {value: "English", label: "English"},
                                            {value: "Hindi", label: "Hindi"},
                                            {value: "Telugu", label: "Telugu"},
                                            {value: "Tamil", label: "Tamil"},
                                            {value: "Kannada", label: "Kannada"},
                                            {value: "Malayalam", label: "Malayalam"},
                                            {value: "Punjabi", label: "Punjabi"},
                                            {value: "Bengali", label: "Bengali"}  
                                        ]}
                                    >
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Select Movie Genre"
                                    name="genre"
                                    rules={[{required: true, message: "Movie Genre is required!"}]}
                                >
                                    <Select 
                                        placeholder="Select Genre"
                                        mode="multiple"
                                        className="custom-select"
                                        allowClear
                                        options={[
                                            {value: "Action", label: "Action"},
                                            {value: "Adventure", label: "Adventure"},
                                            {value: "Animation", label: "Animation"},
                                            {value: "Comedy", label: "Comedy"},
                                            {value: "Crime", label: "Crime"},
                                            {value: "Documentary", label: "Documentary"},
                                            {value: "Drama", label: "Drama"},
                                            {value: "Family", label: "Family"},
                                            {value: "Fantasy", label: "Fantasy"},
                                            {value: "History", label: "History"},
                                            {value: "Horror", label: "Horror"},
                                            {value: "Music", label: "Music"},
                                            {value: "Mystery", label: "Mystery"},
                                            {value: "Romance", label: "Romance"},
                                            {value: "Science Fiction", label: "Science Fiction"},
                                            {value: "TV Movie", label: "TV Movie"},
                                            {value: "Thriller", label: "Thriller"},
                                            {value: "War", label: "War"},
                                            {value: "Western", label: "Western"}
                                        ]}
                                    >
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Poster URL"
                            name="poster"
                            rules={[{required: true, message: "Movie Poster is required!"}]}
                        >
                                <Input type='text' placeholder='Enter the poster URL'></Input>
                            
                        </Form.Item>
                            
                    </Col>
                </Row>
                <Form.Item>
                    <Button 
                        block
                        type='primary'
                        htmlType='submit'
                        style={{fontSize: "1rem", fontWeight: "600"}}
                    >
                        Submit
                    </Button>
                    <Button
                        block
                        className='mt-3'
                       onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    </div>
  )
}

export default MovieForm;