"use client"

import { useState, useEffect } from "react"
import { Card, Switch, Select, Button, Space, Typography, List, Tag } from "antd"
import { BellOutlined, ClockCircleOutlined, DeleteOutlined } from "@ant-design/icons"
import {
  getReminderSettings,
  saveReminderSettings,
  getUpcomingReminders,
  cancelReminder,
} from "../../../utils/reminderUtils"
import { notify } from "../../../utils/notificationUtils"
import moment from "moment"

const { Title, Text } = Typography
const { Option } = Select

const ReminderSettingsTab = () => {
  const [settings, setSettings] = useState(getReminderSettings())
  const [upcomingReminders, setUpcomingReminders] = useState([])

  useEffect(() => {
    loadUpcomingReminders()
  }, [])

  const loadUpcomingReminders = () => {
    setUpcomingReminders(getUpcomingReminders())
  }

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveReminderSettings(newSettings)
    notify("success", "Reminder settings updated")
  }

  const handleCancelReminder = (bookingId) => {
    cancelReminder(bookingId)
    loadUpcomingReminders()
    notify("success", "Reminder cancelled")
  }

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <BellOutlined />
            <span>Reminder Settings</span>
          </div>
        }
      >
        <Space direction="vertical" className="w-full" size="large">
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Email Reminders</Text>
              <div className="text-sm text-gray-500">Get email notifications before your shows</div>
            </div>
            <Switch
              checked={settings.emailReminders}
              onChange={(checked) => handleSettingChange("emailReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Text strong>Push Notifications</Text>
              <div className="text-sm text-gray-500">Get browser notifications before your shows</div>
            </div>
            <Switch
              checked={settings.pushReminders}
              onChange={(checked) => handleSettingChange("pushReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Text strong>Reminder Timing</Text>
              <div className="text-sm text-gray-500">When to send reminders before show time</div>
            </div>
            <Select
              value={settings.reminderTiming}
              onChange={(value) => handleSettingChange("reminderTiming", value)}
              style={{ width: 120 }}
            >
              <Option value="30min">30 minutes</Option>
              <Option value="1hour">1 hour</Option>
              <Option value="2hours">2 hours</Option>
              <Option value="1day">1 day</Option>
            </Select>
          </div>
        </Space>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <ClockCircleOutlined />
            <span>Upcoming Reminders</span>
          </div>
        }
      >
        {upcomingReminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BellOutlined className="text-4xl mb-2" />
            <div>No upcoming reminders</div>
            <div className="text-sm">Book a movie to get reminders</div>
          </div>
        ) : (
          <List
            dataSource={upcomingReminders}
            renderItem={(reminder) => (
              <List.Item
                key={reminder.bookingId}
                actions={[
                  <Button
                    key={`cancel-${reminder.bookingId}`}
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleCancelReminder(reminder.bookingId)}
                  >
                    Cancel
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>{reminder.movieTitle}</Text>
                      <Tag color="blue">{moment(reminder.showTime, "HH:mm").format("hh:mm A")}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div>{reminder.theatreName}</div>
                      <div className="text-xs text-gray-500">
                        Show: {moment(reminder.showDate).format("MMM DD, YYYY")} • Reminder:{" "}
                        {moment(reminder.reminderTime).format("MMM DD, hh:mm A")} • Seats: {reminder.seats.join(", ")}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default ReminderSettingsTab
