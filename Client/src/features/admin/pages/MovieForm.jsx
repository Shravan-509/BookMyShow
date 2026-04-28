import React from 'react';
import { Alert, Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useDispatch } from 'react-redux';
import { addMovieRequest, updateMovieRequest } from '../../../redux/slices/movieSlice';
import { sanitizeInput, validateLength } from '../../../utils/securityValidation';

const MovieForm = ({
    isModalOpen, 
    setIsModalOpen, 
    formType, 
    selectedMovie, 
    setSelectedMovie
}) => {
   
    const dispatch = useDispatch();
   
    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedMovie(null);
    };

    const onFinish = (values) => {
        // Sanitize all inputs
        const sanitizedValues = {
            movieName: sanitizeInput(values.movieName),
            description: sanitizeInput(values.description),
            duration: values.duration,
            releaseDate: values.releaseDate,
            genre: values.genre,
            rating: values.rating,
            language: values.language,
            poster: values.poster
        };
        
        // Validate inputs
        if (!validateLength(sanitizedValues.movieName, 2, 100)) {
            Alert("Movie name must be between 2 and 100 characters");
            return;
        }
        
        if (!validateLength(sanitizedValues.description, 10, 1000)) {
            Alert("Description must be between 10 and 1000 characters");
            return;
        }
        
        if (sanitizedValues.duration <= 0 || sanitizedValues.duration > 300) {
            Alert("Duration must be between 1 and 300 minutes");
            return;
        }
        
        if(formType === "edit")
        {
            dispatch(updateMovieRequest({id: selectedMovie._id, movie: sanitizedValues}))
        }
        else
        {
            dispatch(addMovieRequest(sanitizedValues));
        }
    
        setIsModalOpen(false);
        setSelectedMovie(null);
    }

  return (
    <div>
        <Modal 
            centered 
            title={formType === 'add' ? "Add Movie" : "Edit Movie"} 
            open={isModalOpen}
            onCancel={handleCancel}
            width={800}
            footer={null}
        >
            <Form layout='vertical' initialValues= {selectedMovie} onFinish={onFinish}>
                <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                    <Col span={24}>
                        <Form.Item
                            label="Movie Name"
                            name="movieName"
                            rules={[{required: true, message: "Movie name is required"}]}
                        >
                            <Input type='text' placeholder="Movie Name" size='large'></Input>

                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Description"
                            name="description"
                            rules={[{required: true, message: "Description is required"}]}
                        >
                            <TextArea rows='4' placeholder="Description" size='large'></TextArea>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                            <Col span={12}>
                                <Form.Item
                                    label="Movie Duration (in min)"
                                    name="duration"
                                    rules={[{required: true, message: "Movie Duration is required"}]}
                                >
                                    <Input type='number' placeholder="Movie Duration" size='large'></Input>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Release Date"
                                    name="releaseDate"
                                    rules={[{required: true, message: "Movie Release Date is required"}]}
                                >
                                    <Input type='date' size='large'></Input>
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
                                    rules={[{required: true, message: "Movie Language is required"}]}
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
                                        size='large'
                                    >
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Select Movie Genre"
                                    name="genre"
                                    rules={[{required: true, message: "Movie Genre is required"}]}
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
                                        size='large' 
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
                            rules={[{required: true, message: "Movie Poster is required"}]}
                        >
                                <Input type='text' placeholder='Poster URL' size='large'></Input>
                            
                        </Form.Item>
                            
                    </Col>
                </Row>
                <Form.Item>
                    <Button 
                        block
                        type='primary'
                        htmlType='submit'
                        size='large'
                        className='bg-[#f84464]! hover:bg-[#dc3558]! text-base!'
                    >
                        Submit
                    </Button>
                    <Button
                        block
                        className= 'mt-4 hover:border-[#f84464]! text-gray-600! hover:text-black!'
                        onClick={handleCancel}
                        size='large'
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