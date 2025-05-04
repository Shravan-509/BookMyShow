import React from 'react';
import { Button, Col, Form, Input, message, Modal, Row, Select } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../../../redux/slices/loaderSlice';
import { addTheatre, updateTheatre } from '../../../api/theatre';

const TheatreForm = ({
    isModalOpen, 
    setIsModalOpen, 
    fetchTheatreData, 
    formType, 
    selectedTheatre, 
    setSelectedTheatre
}) => {
   
    const dispatch = useDispatch();
    const {user} = useSelector((state) => state.user);
   
    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedTheatre(null);
    };

    const onFinish = async (values) => {
        try {
            dispatch(showLoading());
            let response = null;
            if(formType === "edit")
            {
                response = await updateTheatre(selectedTheatre._id, values);
            }
            else
            {
                response = await addTheatre({... values, owner: user._id});
            }
            if(response?.success)
            {
                message.success(response.message);
                fetchTheatreData();
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
            setSelectedTheatre(null);
            dispatch(hideLoading());
        }
    }

  return (
    <div>
        <Modal 
            centered 
            title={formType === 'add' ? "Add Theatre" : "Edit Theatre"} 
            open={isModalOpen}
            onCancel={handleCancel}
            width={800}
            footer={null}
        >
            <Form layout='vertical' initialValues = {selectedTheatre} onFinish={onFinish}>
                <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                    <Col span={24}>
                        <Form.Item
                            label="Theatre Name"
                            name="name"
                            htmlFor='name'
                            rules={[{required: true, message: "Theatre name is required"}]}
                        >
                            <Input size="large" id='name' type='text' placeholder="Theatre name"></Input>

                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Theatre Address"
                            name="address"
                            htmlFor='address'
                            rules={[{required: true, message: "Theatre Address is required"}]}
                        >
                            <TextArea size="large" id="address" rows='3' placeholder="Theatre Address"></TextArea>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Row gutter={{xs: 6, sm: 10, md: 12, lg: 16}}>
                            <Col span={12}>
                                <Form.Item
                                    label="Email"
                                     htmlFor='address'
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please enter your email' },
                                        { type: "email", message: "Please enter a valid email" }
                                    ]}
                                >
                                    <Input id="email" type='email' size="large" placeholder="Email"></Input>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Phone Number"
                                    htmlFor='phone'
                                    name="phone"
                                   rules={[
                                        { required: true, message: "Please enter your phone number" },
                                        { pattern: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit phone number" },
                                    ]}
                                >
                                    <Input id="phone" placeholder="Phone Number" size="large"></Input>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Form.Item>
                    <Button 
                        block
                        type='primary'
                        htmlType='submit'
                        size="large"
                        style={{fontSize: "1rem", fontWeight: "600"}}
                    >
                        Submit
                    </Button>
                    <Button
                        block
                        className='mt-4'
                        size="large"
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

export default TheatreForm;