import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get user's name from Clerk user object
 * Falls back to username from database if available
 * @param user - Clerk user object (from useUser hook or currentUser())
 * @returns User's name (firstName) or username or empty string if not available
 */
export function getUserName(user: { firstName?: string | null; username?: string | null } | null | undefined): string {
  if (!user) return ""
  // Try firstName first, then username from Clerk, then empty string
  return user.firstName || user.username || ""
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

// Thailand timezone offset: UTC+7 (no daylight saving time)
const THAILAND_OFFSET_HOURS = 7

/**
 * Check if an event is in the past based on its date and end time
 * Event times are stored in Thailand timezone (Asia/Bangkok, UTC+7)
 * @param date - Event date (string in YYYY-MM-DD format or Date object)
 * @param endTime - Event end time in HH:MM format (24-hour, Thailand timezone)
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
  
  // Create the event end time in UTC by converting from Thailand time (UTC+7)
  // Example: 2:00 PM Thailand = 7:00 AM UTC (14:00 - 7 = 7:00)
  const eventEndDateUTC = Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
  const eventEndDate = new Date(eventEndDateUTC - (THAILAND_OFFSET_HOURS * 60 * 60 * 1000))
  
  return now > eventEndDate
}

/**
 * Create a URL-friendly slug from a workshop title
 * @param title - Workshop title (e.g., "Hoop Beg-Int")
 * @returns URL-friendly slug (e.g., "hoop-beg-int")
 */
export function createTitleSlug(title: string | null | undefined): string {
  if (!title) return ''
  return String(title)
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
 * @param instructor - Instructor name (can be null/undefined)
 * @returns Combined slug (e.g., "40-rope-dart-kit")
 */
export function createEventSlug(id: number, title: string | null | undefined, instructor: string | null | undefined): string {
  const titleSlug = createTitleSlug(title)
  const instructorSlug = createTitleSlug(instructor)
  // If instructor slug is empty, just use id-title
  if (!instructorSlug) {
    return `${id}-${titleSlug}`
  }
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

/**
 * Validate username format
 * @param username - Username to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: "Username is required" }
  }
  
  const trimmed = username.trim()
  
  // Length check: 3-30 characters
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" }
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, error: "Username must be no more than 30 characters" }
  }
  
  // Format check: alphanumeric + hyphens/underscores/dots, no spaces
  const usernameRegex = /^[a-zA-Z0-9._-]+$/
  if (!usernameRegex.test(trimmed)) {
    return { isValid: false, error: "Username can only contain letters, numbers, dots, hyphens, and underscores" }
  }
  
  return { isValid: true }
}

/**
 * Extract YouTube video ID from various URL formats
 * @param urlOrId - YouTube URL or video ID
 * @returns Video ID or null if invalid
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId || urlOrId.trim().length === 0) {
    return null
  }
  
  const trimmed = urlOrId.trim()
  
  // If it's already just an ID (11 characters, alphanumeric + hyphens/underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Get YouTube embed URL from video ID
 * @param videoId - YouTube video ID
 * @returns Embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Extract Vimeo video ID from various URL formats
 * @param urlOrId - Vimeo URL or video ID
 * @returns Video ID or null if invalid
 */
export function extractVimeoId(urlOrId: string): string | null {
  if (!urlOrId || urlOrId.trim().length === 0) {
    return null
  }
  
  const trimmed = urlOrId.trim()
  
  // If it's already just an ID (numeric, typically 7-9 digits)
  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }
  
  // Try to extract from various Vimeo URL formats
  const patterns = [
    /(?:vimeo\.com\/)(\d+)/,
    /(?:vimeo\.com\/video\/)(\d+)/,
    /(?:player\.vimeo\.com\/video\/)(\d+)/,
  ]
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Get Vimeo embed URL from video ID
 * @param videoId - Vimeo video ID
 * @returns Embed URL
 */
export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`
}

/**
 * Calculate years of experience from a start date
 * @param startDate - Start date (string in YYYY-MM-DD format or Date object)
 * @returns Number of years of experience, or null if invalid
 */
export function calculateYearsOfExperience(startDate: string | Date | null | undefined): number | null {
  if (!startDate) return null
  
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  if (isNaN(start.getTime())) return null
  
  const today = new Date()
  let years = today.getFullYear() - start.getFullYear()
  const monthDiff = today.getMonth() - start.getMonth()
  
  // Adjust if the anniversary hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
    years--
  }
  
  return years >= 0 ? years : null
}

/**
 * Validate Instagram handle format
 * @param handle - Instagram handle to validate (with or without @)
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateInstagramHandle(handle: string): { isValid: boolean; error?: string } {
  if (!handle || handle.trim().length === 0) {
    return { isValid: true }; // Optional field
  }
  
  const cleaned = handle.replace(/^@/, '').trim();
  
  if (cleaned.length === 0) {
    return { isValid: true }; // Empty after cleaning is fine
  }
  
  // Instagram handles: 1-30 characters, alphanumeric, dots, underscores
  // Cannot start with dot or underscore
  // Can end with alphanumeric or underscore (but not dot)
  const instagramRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._]*[a-zA-Z0-9_])?$/;
  
  if (!instagramRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: "Invalid Instagram handle format. Use letters, numbers, dots, and underscores only." 
    };
  }
  
  if (cleaned.length > 30) {
    return { isValid: false, error: "Instagram handle must be 30 characters or less" };
  }
  
  return { isValid: true };
}

/**
 * Normalize experience start date to YYYY-MM-DD format
 * Handles Date objects, strings, and null/undefined values
 * @param date - Date value to normalize
 * @returns Normalized date string in YYYY-MM-DD format, or null if invalid
 */
export function normalizeExperienceStartDate(
  date: string | Date | null | undefined
): string | null {
  if (!date) return null;
  
  const dateValue = date instanceof Date ? date : new Date(date);
  if (isNaN(dateValue.getTime())) return null;
  
  return dateValue.toISOString().split('T')[0];
}

/**
 * Sanitize text content to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 * @param text - Text to sanitize
 * @returns Sanitized text safe for display
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
