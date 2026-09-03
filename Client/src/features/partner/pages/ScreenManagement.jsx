import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createScreenRequest,
  deleteScreenRequest,
  fetchScreensByTheatreRequest,
  selectScreenLoading,
  selectScreensByTheatre,
  updateScreenRequest,
} from "../../../redux/slices/screenSlice";
import { sanitizeInput } from "../../../utils/securityValidation";

const ScreenManagement = ({
  isScreenModalOpen,
  setIsScreenModalOpen,
  selectedTheatre,
  setSelectedTheatre,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const dispatch = useDispatch();
  const loading = useSelector(selectScreenLoading);
  const screens = useSelector(selectScreensByTheatre(selectedTheatre?._id));

  useEffect(() => {
    if (selectedTheatre?._id) {
      dispatch(fetchScreensByTheatreRequest({ theatreId: selectedTheatre._id }));
    }
  }, [dispatch, selectedTheatre?._id]);

  const initialValues = useMemo(() => selectedScreen || { isActive: true }, [selectedScreen]);

  const closeModal = () => {
    setIsScreenModalOpen(false);
    setSelectedTheatre(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedScreen(null);
  };

  const onFinish = (values) => {
    const screenPayload = {
      theatre: selectedTheatre._id,
      name: sanitizeInput(values.name),
      screenNumber: values.screenNumber,
      capacity: values.capacity,
      isActive: Boolean(values.isActive),
    };

    if (selectedScreen) {
      dispatch(updateScreenRequest({
        id: selectedScreen._id,
        theatreId: selectedTheatre._id,
        screen: screenPayload,
      }));
    } else {
      dispatch(createScreenRequest({
        theatreId: selectedTheatre._id,
        screen: screenPayload,
      }));
    }

    closeForm();
  };

  const columns = [
    {
      title: "Screen #",
      dataIndex: "screenNumber",
      key: "screenNumber",
      sorter: (a, b) => a.screenNumber - b.screenNumber,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, screen) => (
        <Space>
          <Tooltip title="Edit Screen">
            <Button
              size="large"
              onClick={() => {
                setSelectedScreen(screen);
                setIsFormOpen(true);
              }}
            >
              <EditOutlined />
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete or deactivate this screen?"
            onConfirm={() => dispatch(deleteScreenRequest({
              id: screen._id,
              theatreId: selectedTheatre._id,
            }))}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Screen">
              <Button danger size="large">
                <DeleteOutlined />
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      centered
      title={`Screens - ${selectedTheatre?.name}`}
      open={isScreenModalOpen}
      onCancel={closeModal}
      width={900}
      footer={null}
    >
      <div className="mb-4">
        <Typography.Text strong>Theatre: </Typography.Text>
        <Typography.Text>{selectedTheatre?.name}</Typography.Text>
        {selectedTheatre?.city && (
          <Typography.Text type="secondary">: {selectedTheatre.city.cityName}</Typography.Text>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <Button
          size="large"
          type="primary"
          className="bg-[#f84464]! hover:bg-[#dc3558]!"
          onClick={() => setIsFormOpen(true)}
        >
          Add Screen
        </Button>
      </div>

      <Table
        rowKey="_id"
        loading={loading}
        dataSource={screens}
        columns={columns}
        scroll={{ x: 700 }}
      />

      <Modal
        centered
        title={selectedScreen ? "Edit Screen" : "Add Screen"}
        open={isFormOpen}
        onCancel={closeForm}
        footer={null}
      >
        <Form
          key={selectedScreen?._id || "new-screen"}
          layout="vertical"
          initialValues={initialValues}
          onFinish={onFinish}
        >
          <Form.Item label="Theatre">
            <Input size="large" value={selectedTheatre?.name} disabled />
          </Form.Item>
          <Form.Item
            label="Screen Name"
            name="name"
            rules={[{ required: true, message: "Screen name is required" }]}
          >
            <Input size="large" placeholder="Screen 1" />
          </Form.Item>
          <Form.Item
            label="Screen Number"
            name="screenNumber"
            rules={[{ required: true, message: "Screen number is required" }]}
          >
            <InputNumber min={1} precision={0} className="w-full" size="large" placeholder="1" />
          </Form.Item>
          <Form.Item
            label="Capacity"
            name="capacity"
            rules={[{ required: true, message: "Capacity is required" }]}
          >
            <InputNumber min={1} precision={0} className="w-full" size="large" placeholder="650" />
          </Form.Item>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            className="bg-[#f84464]! hover:bg-[#dc3558]!"
          >
            Submit
          </Button>
        </Form>
      </Modal>
    </Modal>
  );
};

export default ScreenManagement;
