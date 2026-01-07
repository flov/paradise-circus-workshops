import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get user's name from Clerk user object
 * @param user - Clerk user object (from useUser hook or currentUser())
 * @returns User's name (firstName) or empty string if not available
 */
export function getUserName(user: { firstName: string | null | undefined } | null | undefined): string {
  if (!user) return ""
  return user.firstName || ""
}

/**
 * Get user's email from Clerk user object
 * @param user - Clerk user object (from useUser hook or currentUser())
 * @returns User's primary email address or empty string if not available
 */
export function getUserEmail(user: { emailAddresses: Array<{ emailAddress: string }> } | null | undefined): string {
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) return ""
  return user.emailAddresses[0]?.emailAddress || ""
}

/**
 * Check if a workshop is in the past based on its date and end time
 * @param date - Workshop date (string in YYYY-MM-DD format or Date object)
 * @param endTime - Workshop end time in HH:MM format (24-hour)
 * @returns true if the workshop has already ended
 */
export function isWorkshopPast(date: string | Date, endTime: string): boolean {
  const now = new Date()
  
  // Parse the date - handle both string and Date object
  let year: number, month: number, day: number
  
  if (date instanceof Date) {
    year = date.getFullYear()
    month = date.getMonth() + 1
    day = date.getDate()
  } else {
    // Extract date part from string (handle YYYY-MM-DD format)
    const dateOnly = String(date).split('T')[0].split(' ')[0]
    const dateParts = dateOnly.split('-')
    
    if (dateParts.length === 3) {
      year = Number.parseInt(dateParts[0], 10)
      month = Number.parseInt(dateParts[1], 10)
      day = Number.parseInt(dateParts[2], 10)
    } else {
      // Fallback: try parsing as Date
      const tempDate = new Date(date)
      if (isNaN(tempDate.getTime())) {
        return false
      }
      year = tempDate.getFullYear()
      month = tempDate.getMonth() + 1
      day = tempDate.getDate()
    }
  }
  
  // Parse the end time
  const timeParts = endTime.split(':')
  if (timeParts.length < 2) {
    return false
  }
  
  const hours = Number.parseInt(timeParts[0], 10)
  const minutes = Number.parseInt(timeParts[1], 10)
  
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
    return false
  }
  
  // Create a date object for the workshop end time in local timezone
  // Note: month is 0-indexed in Date constructor
  const workshopEndDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  
  return now > workshopEndDate
}
