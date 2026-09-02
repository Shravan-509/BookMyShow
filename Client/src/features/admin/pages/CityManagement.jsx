import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Tooltip } from "antd";
import { EditOutlined, StopOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createCityRequest,
  deactivateCityRequest,
  fetchCitiesRequest,
  selectCities,
  selectCityLoading,
  updateCityRequest,
} from "../../../redux/slices/citySlice";
import { sanitizeInput } from "../../../utils/securityValidation";

const tierOptions = [
  { value: "TIER_1", label: "Tier 1" },
  { value: "TIER_2", label: "Tier 2" },
  { value: "TIER_3", label: "Tier 3" },
];

const tierLabels = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

const CityManagement = () => {
  const dispatch = useDispatch();
  const cities = useSelector(selectCities);
  const loading = useSelector(selectCityLoading);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    dispatch(fetchCitiesRequest({ includeInactive: true }));
  }, [dispatch]);

  const initialValues = useMemo(() => {
    const [longitude, latitude] = selectedCity?.location?.coordinates || [];
    return {
      ...selectedCity,
      longitude,
      latitude,
      isActive: selectedCity?.isActive ?? true,
    };
  }, [selectedCity]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCity(null);
  };

  const onFinish = (values) => {
    const hasCoordinates = Number.isFinite(values.longitude) && Number.isFinite(values.latitude);
    const cityPayload = {
      cityCode: sanitizeInput(values.cityCode)?.toUpperCase(),
      cityName: sanitizeInput(values.cityName),
      state: sanitizeInput(values.state),
      country: sanitizeInput(values.country),
      isActive: Boolean(values.isActive),
      tier: values.tier,
      location: hasCoordinates
        ? {
            type: "Point",
            coordinates: [values.longitude, values.latitude],
          }
        : undefined,
    };

    if (selectedCity) {
      dispatch(updateCityRequest({ id: selectedCity._id, city: cityPayload }));
    } else {
      dispatch(createCityRequest(cityPayload));
    }

    closeModal();
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "cityCode",
      key: "cityCode",
      render: (cityCode) => cityCode || "-",
    },
    {
      title: "City",
      dataIndex: "cityName",
      key: "cityName",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
    },
    {
      title: "Tier",
      dataIndex: "tier",
      key: "tier",
      render: (tier) => tierLabels[tier] || "-",
    },
    {
      title: "Coordinates",
      dataIndex: "location",
      key: "location",
      render: (location) => {
        const [longitude, latitude] = location?.coordinates || [];
        return Number.isFinite(longitude) && Number.isFinite(latitude)
          ? `${longitude}, ${latitude}`
          : "-";
      },
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
      render: (_, city) => (
        <Space>
          <Tooltip title="Edit City">
            <Button
              size="large"
              onClick={() => {
                setSelectedCity(city);
                setIsModalOpen(true);
              }}
            >
              <EditOutlined />
            </Button>
          </Tooltip>
          {city.isActive && (
            <Tooltip title="Deactivate City">
              <Button danger size="large" onClick={() => dispatch(deactivateCityRequest(city._id))}>
                <StopOutlined />
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          size="large"
          className="bg-[#f84464]! hover:bg-[#dc3558]!"
          onClick={() => setIsModalOpen(true)}
        >
          Add City
        </Button>
      </div>
      <Table
        rowKey="_id"
        dataSource={cities}
        columns={columns}
        loading={loading}
        scroll={{ x: 800 }}
      />
      <Modal
        centered
        title={selectedCity ? "Edit City" : "Add City"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Form
          key={selectedCity?._id || "new-city"}
          layout="vertical"
          initialValues={initialValues}
          onFinish={onFinish}
        >
          <Form.Item
            label="City Code"
            name="cityCode"
            rules={[{ pattern: /^[A-Za-z]{2,5}$/, message: "Use 2-5 letters" }]}
          >
            <Input size="large" placeholder="BLR" />
          </Form.Item>
          <Form.Item
            label="City Name"
            name="cityName"
            rules={[{ required: true, message: "City name is required" }]}
          >
            <Input size="large" placeholder="City name" />
          </Form.Item>
          <Form.Item
            label="State"
            name="state"
            rules={[{ required: true, message: "State is required" }]}
          >
            <Input size="large" placeholder="State" />
          </Form.Item>
          <Form.Item
            label="Country"
            name="country"
            rules={[{ required: true, message: "Country is required" }]}
          >
            <Input size="large" placeholder="Country" />
          </Form.Item>
          <Form.Item label="Tier" name="tier">
            <Select
              allowClear
              size="large"
              placeholder="Select tier"
              options={tierOptions}
            />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Longitude" name="longitude">
              <InputNumber
                className="w-full"
                size="large"
                min={-180}
                max={180}
                placeholder="77.5946"
              />
            </Form.Item>
            <Form.Item label="Latitude" name="latitude">
              <InputNumber
                className="w-full"
                size="large"
                min={-90}
                max={90}
                placeholder="12.9716"
              />
            </Form.Item>
          </div>
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
    </div>
  );
};

export default CityManagement;
