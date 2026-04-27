/**
 * Date Formatting Utility - date-fns replacement for moment.js
 * Reduces bundle size by ~52KB
 * 
 * Usage:
 * import { formatDate, formatTime, formatRelative } from './dateFormatter';
 * 
 * formatDate(new Date(), 'dd MMM yyyy')
 */
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
  parseISO,
  isSameDay,
  addDays,
  addHours,
  startOfDay,
  endOfDay,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from 'date-fns';

/**
 * Format date in standard format
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format pattern (e.g., 'dd MMM yyyy')
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('[dateFormatter] Invalid date:', date);
    return '';
  }
};

/**
 * Format time only
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format pattern (default: 'HH:mm')
 * @returns {string} Formatted time
 */
export const formatTime = (date, formatStr = 'HH:mm') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('[dateFormatter] Invalid date:', date);
    return '';
  }
};

/**
 * Format date and time together
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted "dd MMM yyyy, HH:mm"
 */
export const formatDateTime = (date, formatStr = 'dd MMM yyyy HH:mm') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('[dateFormatter] Invalid date:', date);
    return '';
  }
};

/**
 * Format date relative to now (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelative = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.warn('[dateFormatter] Invalid date:', date);
    return '';
  }
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isDateToday = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isToday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Check if date is tomorrow
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isDateTomorrow = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isTomorrow(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Check if date is yesterday
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isDateYesterday = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isYesterday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Format booking date for display
 * Shows "Today", "Tomorrow", "Yesterday", or formatted date
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatBookingDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (isDateToday(dateObj)) return 'Today';
    if (isDateTomorrow(dateObj)) return 'Tomorrow';
    if (isDateYesterday(dateObj)) return 'Yesterday';
    
    return format(dateObj, 'dd MMM yyyy');
  } catch (error) {
    console.warn('[dateFormatter] Invalid date:', date);
    return '';
  }
};

/**
 * Format show time for display
 * @param {Date|string} startDate - Show start time
 * @param {Date|string} endDate - Show end time (optional)
 * @returns {string} e.g., "14:30 - 17:00"
 */
export const formatShowTime = (startDate, endDate = null) => {
  try {
    const startObj = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
    const startTime = format(startObj, 'HH:mm');
    
    if (endDate) {
      const endObj = typeof endDate === 'string' ? parseISO(endDate) : new Date(endDate);
      const endTime = format(endObj, 'HH:mm');
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
  } catch (error) {
    console.warn('[dateFormatter] Invalid date:', startDate);
    return '';
  }
};

/**
 * Get days until date
 * @param {Date|string} date - Target date
 * @returns {number} Days until (negative = past)
 */
export const daysUntil = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return differenceInDays(dateObj, new Date());
  } catch (error) {
    return 0;
  }
};

/**
 * Get hours until date
 * @param {Date|string} date - Target date
 * @returns {number} Hours until (negative = past)
 */
export const hoursUntil = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return differenceInHours(dateObj, new Date());
  } catch (error) {
    return 0;
  }
};

/**
 * Get minutes until date
 * @param {Date|string} date - Target date
 * @returns {number} Minutes until (negative = past)
 */
export const minutesUntil = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return differenceInMinutes(dateObj, new Date());
  } catch (error) {
    return 0;
  }
};

/**
 * Check if show is happening today
 * @param {Date|string} showDate - Show date
 * @returns {boolean}
 */
export const isShowToday = (showDate) => {
  try {
    const dateObj = typeof showDate === 'string' ? parseISO(showDate) : new Date(showDate);
    return isDateToday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Check if show has passed
 * @param {Date|string} showDate - Show date
 * @returns {boolean}
 */
export const hasShowPassed = (showDate) => {
  try {
    const dateObj = typeof showDate === 'string' ? parseISO(showDate) : new Date(showDate);
    return new Date() > dateObj;
  } catch (error) {
    return false;
  }
};

/**
 * Get show duration in readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} e.g., "2h 30m"
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Parse date from various formats
 * @param {string} dateString - Date string to parse
 * @param {string} formatPattern - Format pattern for parsing
 * @returns {Date|null}
 */
export const parseDate = (dateString, formatPattern = 'dd/MM/yyyy') => {
  try {
    return parse(dateString, formatPattern, new Date());
  } catch (error) {
    console.warn('[dateFormatter] Failed to parse date:', dateString, formatPattern);
    return null;
  }
};


/**
 * Check if a date falls within a given date range (inclusive)
 * Compares using startOfDay and endOfDay to ignore time differences
 *
 * @param {Date|string} date - Date to check (Date object or ISO string)
 * @param {Date} start - Start date of range
 * @param {Date} end - End date of range
 * @returns {boolean} True if date is within range (inclusive), else false
 */

export const isWithinDateRange = (date, start, end) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);

    return (
      d >= startOfDay(start) &&
      d <= endOfDay(end)
    );
  } catch (error) {
    console.warn('[dateFormatter] Invalid date range check:', date, start, end);
    return false;
  }
};

/**
 * Parse and format time string
 * @param {string} time - Time string (e.g., "14:30")
 * @param {string} inputFormat - Input format
 * @param {string} outputFormat - Output format
 * @returns {string}
 */
export const formatParsedTime = (time, inputFormat = "HH:mm", outputFormat = "hh:mm a") => {
  try {
    const parsed = parse(time, inputFormat, new Date());
    return format(parsed, outputFormat);
  } catch (error) {
    console.warn('[dateFormatter] Invalid time:', time);
    return '';
  }
};