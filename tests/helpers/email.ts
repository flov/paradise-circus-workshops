import { vi } from 'vitest'
import * as emailLib from '@/lib/email'

type SentEmail = {
  type: string
  to: string
  props: Record<string, unknown>
}

const sentEmails: SentEmail[] = []

/**
 * Reset email tracking
 */
export function resetEmailMocks() {
  sentEmails.length = 0
}

/**
 * Get all sent emails
 */
export function getSentEmails(): SentEmail[] {
  return [...sentEmails]
}

/**
 * Get emails sent to a specific address
 */
export function getEmailsTo(email: string): SentEmail[] {
  return sentEmails.filter(e => e.to === email)
}

/**
 * Get emails of a specific type
 */
export function getEmailsByType(type: string): SentEmail[] {
  return sentEmails.filter(e => e.type === type)
}

/**
 * Check if an email was sent
 */
export function wasEmailSent(type: string, to?: string): boolean {
  if (to) {
    return sentEmails.some(e => e.type === type && e.to === to)
  }
  return sentEmails.some(e => e.type === type)
}

// Mock all email functions
vi.mock('@/lib/email', async () => {
  const actual = await vi.importActual<typeof emailLib>('@/lib/email')
  
  return {
    ...actual,
    sendParticipationConfirmationEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'participation-confirmation',
        to: props.participantEmail,
        props,
      })
      return { success: true, html: '<html>test</html>', text: 'test' }
    }),
    sendAdminNotificationEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'admin-notification',
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        props,
      })
      return { success: true }
    }),
    sendCommentNotificationEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'comment-notification',
        to: props.recipientEmail,
        props,
      })
      return { success: true }
    }),
    sendEventPendingApprovalEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'event-pending-approval',
        to: props.instructorEmail,
        props,
      })
      return { success: true }
    }),
    sendAdminEventPendingEmail: vi.fn(async (props, adminEmail) => {
      sentEmails.push({
        type: 'admin-event-pending',
        to: adminEmail,
        props,
      })
      return { success: true }
    }),
    sendEventApprovedEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'event-approved',
        to: props.instructorEmail,
        props,
      })
      return { success: true }
    }),
    sendEventCancelledEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'event-cancelled',
        to: props.participantEmail,
        props,
      })
      return { success: true }
    }),
    sendInstructorAssignedEmail: vi.fn(async (props) => {
      sentEmails.push({
        type: 'instructor-assigned',
        to: props.instructorEmail,
        props,
      })
      return { success: true }
    }),
  }
})
