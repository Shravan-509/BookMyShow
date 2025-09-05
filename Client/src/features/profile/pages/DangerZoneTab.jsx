import React, { useState, useEffect } from "react"
import { Alert, Button, Card, Form, Input, Modal, Typography } from "antd";
import { DeleteOutlined, LockOutlined } from "@ant-design/icons";
import { useProfile } from "../../../hooks/useProfile";

const {Title, Text, Paragraph} = Typography;

const  DangerZoneTab = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForm] = Form.useForm();

  const {profile, deleteAccountLoading, deleteAccountError, deleteAccount, clearErrors  } = useProfile();

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  }

  const handleConfirmDelete = (values) => {
    deleteAccount(values.password);

  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    deleteForm.resetFields();
    clearErrors();
  }

  return (
   <Card 
      title={
        <Title level={4} className="!mb-0 !text-[#f84464]">
          Danger Zone
        </Title>
      }
      className="!rounded-xl"
      styles={{
          body: {
            padding: '24px'
          }
      }}
    >
       <Paragraph className="!text-gray-500 !mb-6 !text-sm">
          These actions are irreversible. Please proceed with caution.
      </Paragraph>
      { 
        deleteAccountError && (
          <Alert
            message="Account Deletion Failed"
            description={deleteAccountError}
            type="error"
            showIcon
            closable
            onClose={clearErrors}
            className="!mb-4"
          />
      )}

      {/* Delete Box */}
      <div className="rounded-lg p-6 bg-[#fff2f0] border border-[#f84464]">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <Title level={5} style={{ color: "#f84464", marginBottom: 8 }}>
              Delete Account
            </Title>
            <Text style={{ color: "#666" }}>
              Permanently deletes your account and all associated data. This action cannot be undone.
            </Text>

            <div className="mt-4">
              <Text strong style={{ color: "#f84464" }}>
                This will:
              </Text>
              <ul className="mt-2 text-gray-600 text-sm list-disc list-inside">
                <li>Delete your profile and personal information</li>
                <li>Remove all your account data</li>
                {
                  profile?.role === "user" && <li>Delete your Booking History</li> 
                }
                <li>Log you out of all devices</li>
              </ul>
            </div>
          </div>

          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleDeleteAccount} 
            className="!bg-[#f84464] hover:!bg-[#dc3558] !text-white"
          >
            Delete Account
          </Button>
        </div>
      </div>
    
      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <Title level={4} style={{ textAlign: "center", marginBottom: 0 }}>
            Are you sure you want to delete your account?
          </Title>
        }
        open={showDeleteModal}
        onCancel={handleCancelDelete}
        footer={null}
        centered
      >
        <div className="py-4">
          <Alert
            message="This action is irreversible!"
            description="Once you delete your account, all your data will be permanently removed and cannot be recovered."
            type="error"
            showIcon
            className="!mb-6"
          />

          <Form form={deleteForm} layout="vertical" onFinish={handleConfirmDelete}>
            <Form.Item
              name="password"
              label={<Text strong>Enter your password to confirm</Text>}
              rules={[
                { 
                  required: true, 
                  message: "Please enter your password to confirm deletion" 
                }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Enter your password" 
                size="large" 
              />
            </Form.Item>

            <Form.Item className="!mt-6 !mb-0">
              <div className="flex gap-3 justify-end">
                <Button 
                  onClick={handleCancelDelete}
                  block
                  className= 'hover:!border-[#f84464] !text-gray-600 hover:!text-black'
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  danger
                  htmlType="submit"
                  block
                  loading={deleteAccountLoading}
                  icon={<DeleteOutlined />}
                  className='!bg-[#f84464] hover:!bg-[#dc3558] !text-white'
                >
                  Delete My Account
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </Card>

  )
}

export default  DangerZoneTab