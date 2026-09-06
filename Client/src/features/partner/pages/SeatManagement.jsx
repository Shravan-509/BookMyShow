import { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Segmented, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  bulkCreateSeatsRequest,
  createSeatRequest,
  disableSeatRequest,
  fetchSeatsByScreenRequest,
  selectSeatLoading,
  selectSeatSummaryByScreen,
  selectSeatsByScreen,
  updateSeatRequest,
} from "../../../redux/slices/seatSlice";
import {
  buildSeatNumber,
  countPreviewSeats,
  getSequentialSeatPreview,
  normalizeRow,
  parseExcludedColumns,
} from "./seatManagementUtils";

const SEAT_TYPE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "RECLINER", label: "Recliner" },
];

const SeatManagement = ({
  isSeatModalOpen,
  setIsSeatModalOpen,
  selectedTheatre,
  selectedScreen,
  setSelectedScreen,
}) => {
  const [isSeatFormOpen, setIsSeatFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState("manual");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatForm] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const dispatch = useDispatch();
  const loading = useSelector(selectSeatLoading);
  const seats = useSelector(selectSeatsByScreen(selectedScreen?._id));
  const summary = useSelector(selectSeatSummaryByScreen(selectedScreen?._id));
  const watchedRow = Form.useWatch("row", seatForm);
  const watchedColumn = Form.useWatch("column", seatForm);
  const watchedBulkRows = Form.useWatch("rows", bulkForm);
  const watchedSequential = Form.useWatch("sequential", bulkForm);

  const activeSeatCount = summary?.activeSeatCount ?? seats.filter((seat) => seat.isActive).length;
  const capacity = summary?.capacity ?? selectedScreen?.capacity ?? 0;
  const remainingCapacity = summary?.remainingCapacity ?? Math.max(capacity - activeSeatCount, 0);
  const layoutStatus = summary?.layoutStatus ?? (activeSeatCount === capacity ? "COMPLETE" : "INCOMPLETE");
  const manualPreviewSeats = countPreviewSeats(watchedBulkRows);
  const sequentialPreview = getSequentialSeatPreview(watchedSequential, { activeSeatCount, capacity });
  const previewSeats = bulkMode === "manual" ? manualPreviewSeats : sequentialPreview.seatsToCreate;
  const afterBulkCount = activeSeatCount + previewSeats;
  const bulkExceedsCapacity = afterBulkCount > capacity;
  const previewRemaining = Math.max(capacity - afterBulkCount, 0);
  const layoutAfterCreation = afterBulkCount === capacity ? "COMPLETE" : "INCOMPLETE";
  const disableBulkSubmit = bulkMode === "manual"
    ? bulkExceedsCapacity || previewSeats === 0
    : !sequentialPreview.isValid || sequentialPreview.exceedsCapacity || sequentialPreview.seatsToCreate === 0;

  useEffect(() => {
    if (selectedScreen?._id) {
      dispatch(fetchSeatsByScreenRequest({ screenId: selectedScreen._id }));
    }
  }, [dispatch, selectedScreen?._id]);

  useEffect(() => {
    seatForm.setFieldsValue({
      seatNumber: buildSeatNumber({ row: watchedRow, column: watchedColumn }),
    });
  }, [seatForm, watchedColumn, watchedRow]);

  const closeModal = () => {
    setIsSeatModalOpen(false);
    setSelectedScreen(null);
  };

  const closeSeatForm = () => {
    setIsSeatFormOpen(false);
    setSelectedSeat(null);
    seatForm.resetFields();
  };

  const closeBulkForm = () => {
    setIsBulkFormOpen(false);
    bulkForm.resetFields();
    setBulkMode("manual");
  };

  const openEditSeat = (seat) => {
    setSelectedSeat(seat);
    seatForm.setFieldsValue({
      row: seat.row,
      column: seat.column,
      seatNumber: seat.seatNumber,
      seatType: seat.seatType,
      isActive: seat.isActive,
    });
    setIsSeatFormOpen(true);
  };

  const onSeatFinish = (values) => {
    const row = normalizeRow(values.row);
    const column = Number(values.column);
    const seat = {
      screen: selectedScreen._id,
      row,
      column,
      seatNumber: buildSeatNumber({ row, column }),
      seatType: values.seatType,
      isActive: values.isActive ?? true,
    };

    if (selectedSeat) {
      dispatch(updateSeatRequest({
        id: selectedSeat._id,
        screenId: selectedScreen._id,
        seat,
      }));
    } else {
      dispatch(createSeatRequest({
        screenId: selectedScreen._id,
        seat,
      }));
    }

    closeSeatForm();
  };

  const onBulkFinish = (values) => {
    const rows = bulkMode === "manual"
      ? values.rows.map((row) => ({
        row: normalizeRow(row.row),
        startColumn: Number(row.startColumn),
        endColumn: Number(row.endColumn),
        seatType: row.seatType,
        excludedColumns: parseExcludedColumns(row.excludedColumns),
      }))
      : sequentialPreview.rows;

    dispatch(bulkCreateSeatsRequest({
      screenId: selectedScreen._id,
      rows,
    }));
    closeBulkForm();
  };

  const columns = [
    {
      title: "Seat Number",
      dataIndex: "seatNumber",
      key: "seatNumber",
      render: (seatNumber) => <strong>{seatNumber}</strong>,
    },
    {
      title: "Row",
      dataIndex: "row",
      key: "row",
    },
    {
      title: "Column",
      dataIndex: "column",
      key: "column",
      sorter: (a, b) => a.column - b.column,
    },
    {
      title: "Seat Type",
      dataIndex: "seatType",
      key: "seatType",
      render: (seatType) => seatType?.replace("_", " "),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Disabled"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, seat) => (
        <Space>
          <Button aria-label={`Edit ${seat.seatNumber}`} size="large" onClick={() => openEditSeat(seat)}>
            <EditOutlined />
          </Button>
          {seat.isActive ? (
            <Popconfirm
              title="Disable this seat?"
              onConfirm={() => dispatch(disableSeatRequest({
                id: seat._id,
                screenId: selectedScreen._id,
              }))}
              okText="Yes"
              cancelText="No"
            >
              <Button aria-label={`Disable ${seat.seatNumber}`} danger size="large">
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          ) : (
            <Button
              aria-label={`Enable ${seat.seatNumber}`}
              size="large"
              onClick={() => dispatch(updateSeatRequest({
                id: seat._id,
                screenId: selectedScreen._id,
                seat: { ...seat, isActive: true },
              }))}
            >
              <CheckOutlined />
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      centered
      title={`Seats - ${selectedScreen?.name}`}
      open={isSeatModalOpen}
      onCancel={closeModal}
      width={1100}
      footer={null}
    >
      <Space orientation="vertical" size="large" className="w-full">
        <div>
          <Typography.Text strong>Theatre: </Typography.Text>
          <Typography.Text>{selectedTheatre?.name}</Typography.Text>
          <Typography.Text type="secondary"> | Screen {selectedScreen?.screenNumber}</Typography.Text>
        </div>

        <Row gutter={16}>
          <Col xs={24} sm={6}>
            <Statistic title="Capacity" value={capacity} />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic title="Configured Seats" value={activeSeatCount} />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic title="Remaining" value={remainingCapacity} />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic title="Layout Status" value={layoutStatus} />
          </Col>
        </Row>

        <div className="flex justify-end gap-3">
          <Button size="large" onClick={() => setIsBulkFormOpen(true)}>
            Bulk Create Seats
          </Button>
          <Button
            size="large"
            type="primary"
            className="bg-[#f84464]! hover:bg-[#dc3558]!"
            onClick={() => {
              seatForm.setFieldsValue({ seatType: "STANDARD", isActive: true });
              setIsSeatFormOpen(true);
            }}
          >
            Add Seat
          </Button>
        </div>

        <Table
          rowKey="_id"
          loading={loading}
          dataSource={seats}
          columns={columns}
          scroll={{ x: 800 }}
        />
      </Space>

      <Modal
        centered
        title={selectedSeat ? "Edit Seat" : "Add Seat"}
        open={isSeatFormOpen}
        onCancel={closeSeatForm}
        footer={null}
      >
        <Form
          form={seatForm}
          layout="vertical"
          onFinish={onSeatFinish}
          initialValues={{ seatType: "STANDARD", isActive: true }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Row" name="row" rules={[{ required: true, message: "Row is required" }]}>
                <Input size="large" placeholder="A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Column" name="column" rules={[{ required: true, message: "Column is required" }]}>
                <InputNumber min={1} precision={0} className="w-full" size="large" placeholder="1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Seat Number" name="seatNumber">
            <Input size="large" disabled />
          </Form.Item>
          <Form.Item label="Seat Type" name="seatType" rules={[{ required: true, message: "Seat type is required" }]}>
            <Select size="large" options={SEAT_TYPE_OPTIONS} />
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

      <Modal
        centered
        title="Bulk Create Seats"
        open={isBulkFormOpen}
        onCancel={closeBulkForm}
        footer={null}
        width={800}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={onBulkFinish}
          initialValues={{
            rows: [{ row: "A", startColumn: 1, endColumn: 10, seatType: "STANDARD" }],
            sequential: {
              startingRow: "A",
              numberOfRows: 25,
              seatsPerRow: 20,
              seatType: "STANDARD",
            },
          }}
        >
          <Form.Item label="Bulk Creation Mode">
            <Segmented
              options={[
                { label: "Manual Rows", value: "manual" },
                { label: "Sequential Rows", value: "sequential" },
              ]}
              value={bulkMode}
              onChange={setBulkMode}
            />
          </Form.Item>

          {bulkMode === "manual" ? (
            <Form.List name="rows">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" className="w-full">
                  {fields.map((field) => {
                    const { key, ...restField } = field;

                    return (
                    <Row gutter={12} key={key} align="middle">
                      <Col span={4}>
                        <Form.Item {...restField} label="Row" name={[field.name, "row"]} rules={[{ required: true }]}>
                          <Input placeholder="A" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} label="Start Column" name={[field.name, "startColumn"]} rules={[{ required: true }]}>
                          <InputNumber min={1} precision={0} className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} label="End Column" name={[field.name, "endColumn"]} rules={[{ required: true }]}>
                          <InputNumber min={1} precision={0} className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} label="Seat Type" name={[field.name, "seatType"]} rules={[{ required: true }]}>
                          <Select options={SEAT_TYPE_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...restField} label="Excluded" name={[field.name, "excludedColumns"]}>
                          <Input placeholder="5,6" />
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        {fields.length > 1 && (
                          <Button danger onClick={() => remove(field.name)}>
                            -
                          </Button>
                        )}
                      </Col>
                    </Row>
                    );
                  })}
                  <Button icon={<PlusOutlined />} onClick={() => add({ seatType: "STANDARD" })}>
                    Add Row Definition
                  </Button>
                </Space>
              )}
            </Form.List>
          ) : (
            <>
              <Row gutter={12}>
                <Col xs={24} sm={6}>
                  <Form.Item label="Starting Row" name={["sequential", "startingRow"]} rules={[{ required: true }]}>
                    <Input placeholder="A" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item label="Number of Rows" name={["sequential", "numberOfRows"]} rules={[{ required: true }]}>
                    <InputNumber min={1} precision={0} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item label="Seats Per Row" name={["sequential", "seatsPerRow"]} rules={[{ required: true }]}>
                    <InputNumber min={1} precision={0} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item label="Seat Type" name={["sequential", "seatType"]} rules={[{ required: true }]}>
                    <Select options={SEAT_TYPE_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Excluded Columns" name={["sequential", "excludedColumns"]}>
                <Input placeholder="10,11" />
              </Form.Item>
            </>
          )}

          <Alert
            className="mt-4"
            showIcon
            type={disableBulkSubmit ? "error" : "info"}
            title={`Seats to create: ${previewSeats}`}
            description={bulkMode === "manual"
              ? `Currently configured: ${activeSeatCount}. Screen capacity: ${capacity}. After creation: ${afterBulkCount}. Remaining: ${previewRemaining}. Layout after creation: ${layoutAfterCreation}.`
              : `Rows: ${sequentialPreview.startingRow || "-"} - ${sequentialPreview.endingRow || "-"}. Row count: ${sequentialPreview.numberOfRows || 0}. Columns per row: ${sequentialPreview.seatsPerRow || 0}. Excluded per row: ${sequentialPreview.excludedPerRow || 0}. Currently configured: ${activeSeatCount}. Screen capacity: ${capacity}. After creation: ${sequentialPreview.afterCreation}. Remaining: ${sequentialPreview.remaining}. Layout after creation: ${sequentialPreview.layoutStatus}.${sequentialPreview.error ? ` ${sequentialPreview.error}.` : ""}`}
          />

          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            disabled={disableBulkSubmit}
            className="mt-4 bg-[#f84464]! hover:bg-[#dc3558]!"
          >
            Create Seats
          </Button>
        </Form>
      </Modal>
    </Modal>
  );
};

export default SeatManagement;
