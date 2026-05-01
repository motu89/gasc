/**
 * Get current time in Pakistan (Asia/Karachi timezone)
 * Returns a Date object representing the current time in Pakistan
 */
export function getPakistanTime(): Date {
  // Get current time in Pakistan (UTC+5)
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const pakistanTime = new Date(utcTime + 5 * 3600000); // UTC+5
  return pakistanTime;
}

/**
 * Format date to Pakistan local time string
 * @param date - Date to format
 * @returns Formatted time string in 12-hour format
 */
export function formatPakistanTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if a booking date/time is at least 2 hours ahead of current Pakistan time
 * @param bookingDate - Booking date string (ISO format)
 * @param bookingTime - Booking time string (e.g., "9:00 AM")
 * @returns Object with isValid flag and message
 */
export function validateBookingTime(
  bookingDate: string,
  bookingTime: string
): { isValid: boolean; message: string } {
  const pakistanNow = getPakistanTime();
  
  // Parse the booking date and time
  const bookingDateTimeStr = `${new Date(bookingDate).toLocaleDateString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })} ${bookingTime}`;
  
  // Create booking datetime in Pakistan timezone
  const bookingDateTime = new Date(bookingDateTimeStr);
  
  // Calculate minimum allowed time (2 hours from now in Pakistan)
  const minAllowedTime = new Date(pakistanNow.getTime() + 2 * 3600000); // +2 hours
  
  if (bookingDateTime <= minAllowedTime) {
    const formattedMinTime = formatPakistanTime(minAllowedTime);
    return {
      isValid: false,
      message: `Bookings must be at least 2 hours in advance. Please select a time after ${formattedMinTime} (Pakistan Time).`,
    };
  }
  
  return {
    isValid: true,
    message: 'Booking time is valid.',
  };
}

/**
 * Calculate 10% deposit amount
 * @param fullPrice - Full service price
 * @returns Deposit amount (10% of full price)
 */
export function calculateDeposit(fullPrice: number): number {
  return Math.round((fullPrice * 0.1) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format time slot for display
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string in 12-hour format
 */
export function formatTimeSlot(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Generate available time slots starting from minimum allowed time
 * @returns Array of available time slots
 */
export function generateAvailableTimeSlots(): string[] {
  const pakistanNow = getPakistanTime();
  const minTime = new Date(pakistanNow.getTime() + 2 * 3600000); // +2 hours
  
  const slots: string[] = [];
  const startHour = minTime.getHours();
  
  // Generate slots from the minimum allowed hour
  for (let hour = startHour; hour <= 17; hour++) {
    slots.push(formatTimeSlot(hour));
    if (hour < 17) {
      slots.push(formatTimeSlot(hour, 30));
    }
  }
  
  return slots;
}
