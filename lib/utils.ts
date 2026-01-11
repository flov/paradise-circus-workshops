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
 * Check if an event is in the past based on its date and end time
 * @param date - Event date (string in YYYY-MM-DD format or Date object)
 * @param endTime - Event end time in HH:MM format (24-hour)
 * @returns true if the event has already ended
 */
export function isEventPast(date: string | Date, endTime: string): boolean {
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
  
  // Create a date object for the event end time in local timezone
  // Note: month is 0-indexed in Date constructor
  const eventEndDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  
  return now > eventEndDate
}

/**
 * Create a URL-friendly slug from a workshop title
 * @param title - Workshop title (e.g., "Hoop Beg-Int")
 * @returns URL-friendly slug (e.g., "hoop-beg-int")
 */
export function createTitleSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Create an event URL slug combining ID, title, and instructor
 * @param id - Event ID
 * @param title - Event title
 * @param instructor - Instructor name
 * @returns Combined slug (e.g., "40-rope-dart-kit")
 */
export function createEventSlug(id: number, title: string, instructor: string): string {
  const titleSlug = createTitleSlug(title)
  const instructorSlug = createTitleSlug(instructor)
  return `${id}-${titleSlug}-${instructorSlug}`
}

/**
 * Parse an event slug to extract the numeric ID
 * Supports both old format (numeric only) and new format (id-title-slug)
 * @param slug - URL slug (e.g., "30-hoop-beg-int" or "30")
 * @returns Event ID as number, or null if invalid
 */
export function parseEventSlug(slug: string): number | null {
  if (!slug) return null
  
  // Handle old format: numeric only
  if (/^\d+$/.test(slug)) {
    return Number.parseInt(slug, 10)
  }
  
  // Handle new format: id-title-slug
  // Extract the numeric ID from the beginning
  const match = slug.match(/^(\d+)/)
  if (match) {
    return Number.parseInt(match[1], 10)
  }
  
  return null
}

/**
 * Extract initials from a participant name
 * @param name - Participant name (e.g., "John Doe" or "Mary Jane Smith")
 * @returns Initials string (e.g., "JD" or "MJS")
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return ""
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    // Single name: return first two letters
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // Multiple names: return first letter of first and last name
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  
  return name.substring(0, 2).toUpperCase()
}
