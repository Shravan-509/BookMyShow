import { notify } from "./notificationUtils"
import {
  format,
  parse,
  parseISO,
  isAfter,
  isBefore,
  sub,
  compareAsc,
} from "date-fns";

/**
 * Booking reminder utility functions
 */

// Store reminders in localStorage (in production, this would be in a database)
const REMINDERS_KEY = "booking_reminders"

// ---------------- SETTINGS ----------------
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

// ---------------- HELPERS ----------------

const getShowDateTime = (booking) => {
  return parse(
    `${booking.showDate} ${booking.showTime}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );
};

// ---------------- SCHEDULE ----------------
export const scheduleBookingReminder = (booking) => {
  const reminders = getScheduledReminders()
  const settings = getReminderSettings()

  if (!settings.emailReminders && !settings.pushReminders) return

  const showDateTime = getShowDateTime(booking)
  const now = new Date()

  // Calculate reminder time based on user preference
  let reminderTime
  switch (settings.reminderTiming) {
    case "30min":
      reminderTime = sub(showDateTime, { minutes : 30 })
      break
    case "1hour":
      reminderTime = sub(showDateTime, { hours : 1 })
      break
    case "2hours":
      reminderTime = sub(showDateTime, { hours : 2 })
      break
    case "1day":
      reminderTime = sub(showDateTime, { days : 1 })
      break
    default:
      reminderTime = sub(showDateTime, { hours : 2 })
  }

  // Only schedule if reminder time is in the future
  if (isAfter(reminderTime, now)) 
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

// ---------------- GET ----------------
export const getScheduledReminders = () => {
  const reminders = localStorage.getItem(REMINDERS_KEY)
  return reminders ? JSON.parse(reminders) : []
}

// ---------------- CHECK + TRIGGER ----------------
export const checkAndTriggerReminders = () => {
  const reminders = getScheduledReminders()
  const now = new Date()
  const updatedReminders = []

  reminders.forEach((reminder) => {
    const reminderTime = parseISO(reminder.reminderTime);
    if (!reminder.isTriggered && isBefore(reminderTime, now)) {
      // Trigger the reminder
      triggerReminder(reminder)
      reminder.isTriggered = true
    }

    // Keep reminders for shows that haven't passed yet
    const showDateTime = getShowDateTime(reminder)
    if (isAfter(showDateTime, now)) 
    {
      updatedReminders.push(reminder)
    }
  })

  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders))
}

// ---------------- TRIGGER ----------------
const triggerReminder = (reminder) => {
  const showTime = format(
    parse(reminder.showTime, "HH:mm", new Date()),
    "hh:mm a"
  );

  const showDate = format(
    new Date(reminder.showDate),
    "MMM dd, yyyy"
  );

  notify(
    "info",
    "Show Reminder",
    `Don't forget! Your movie "${reminder.movieTitle}" starts at ${showTime} on ${showDate} at ${reminder.theatreName}. Seats: ${reminder.seats.join(", ")}`,
  )
}

// ---------------- CANCEL ----------------
export const cancelReminder = (bookingId) => {
  const reminders = getScheduledReminders()
  const updatedReminders = reminders.filter((r) => r.bookingId !== bookingId)
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders))
}

// ---------------- UPCOMING ----------------
export const getUpcomingReminders = () => {
  const reminders = getScheduledReminders()
  const now = new Date()

  return reminders
    .filter(
      (r) => !r.isTriggered && isAfter(parseISO(r.reminderTime), now)
    )
    .sort((a, b) => 
      compareAsc(parseISO(a.reminderTime), parseISO(b.reminderTime))
    )
  }
