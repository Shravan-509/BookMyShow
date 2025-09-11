import { notify } from "./notificationUtils"
import moment from "moment"

/**
 * Booking reminder utility functions
 */

// Store reminders in localStorage (in production, this would be in a database)
const REMINDERS_KEY = "booking_reminders"

export const getReminderSettings = () => {
  const settings = localStorage.getItem("reminder_settings")
  return settings
    ? JSON.parse(settings)
    : {
        emailReminders: true,
        pushReminders: true,
        reminderTiming: "2hours", // 30min, 1hour, 2hours, 1day
      }
}

export const saveReminderSettings = (settings) => {
  localStorage.setItem("reminder_settings", JSON.stringify(settings))
}

export const scheduleBookingReminder = (booking) => {
  const reminders = getScheduledReminders()
  const settings = getReminderSettings()

  if (!settings.emailReminders && !settings.pushReminders) return

  const showDateTime = moment(`${booking.showDate} ${booking.showTime}`, "YYYY-MM-DD HH:mm")
  const now = moment()

  // Calculate reminder time based on user preference
  let reminderTime
  switch (settings.reminderTiming) {
    case "30min":
      reminderTime = showDateTime.clone().subtract(30, "minutes")
      break
    case "1hour":
      reminderTime = showDateTime.clone().subtract(1, "hour")
      break
    case "2hours":
      reminderTime = showDateTime.clone().subtract(2, "hours")
      break
    case "1day":
      reminderTime = showDateTime.clone().subtract(1, "day")
      break
    default:
      reminderTime = showDateTime.clone().subtract(2, "hours")
  }

  // Only schedule if reminder time is in the future
  if (reminderTime.isAfter(now)) 
    {
    const reminder = {
      id: `reminder_${booking.bookingId}`,
      bookingId: booking.bookingId,
      movieTitle: booking.movieTitle,
      theatreName: booking.theatreName,
      showDate: booking.showDate,
      showTime: booking.showTime,
      seats: booking.seats,
      reminderTime: reminderTime.toISOString(),
      isTriggered: false,
    }

    reminders.push(reminder)
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders))
  }
}

export const getScheduledReminders = () => {
  const reminders = localStorage.getItem(REMINDERS_KEY)
  return reminders ? JSON.parse(reminders) : []
}

export const checkAndTriggerReminders = () => {
  const reminders = getScheduledReminders()
  const now = moment()
  const updatedReminders = []

  reminders.forEach((reminder) => {
    if (!reminder.isTriggered && moment(reminder.reminderTime).isBefore(now)) {
      // Trigger the reminder
      triggerReminder(reminder)
      reminder.isTriggered = true
    }

    // Keep reminders for shows that haven't passed yet
    const showDateTime = moment(`${reminder.showDate} ${reminder.showTime}`, "YYYY-MM-DD HH:mm")
    if (showDateTime.isAfter(now)) {
      updatedReminders.push(reminder)
    }
  })

  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders))
}

const triggerReminder = (reminder) => {
  const showTime = moment(reminder.showTime, "HH:mm").format("hh:mm A")
  const showDate = moment(reminder.showDate).format("MMM DD, YYYY")

  notify(
    "info",
    "Show Reminder",
    `Don't forget! Your movie "${reminder.movieTitle}" starts at ${showTime} on ${showDate} at ${reminder.theatreName}. Seats: ${reminder.seats.join(", ")}`,
  )
}

export const cancelReminder = (bookingId) => {
  const reminders = getScheduledReminders()
  const updatedReminders = reminders.filter((r) => r.bookingId !== bookingId)
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders))
}

export const getUpcomingReminders = () => {
  const reminders = getScheduledReminders()
  const now = moment()

  return reminders
    .filter((r) => !r.isTriggered && moment(r.reminderTime).isAfter(now))
    .sort((a, b) => moment(a.reminderTime).diff(moment(b.reminderTime)))
}
