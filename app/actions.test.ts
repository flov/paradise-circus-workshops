import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createBooking, cancelBooking, cancelBookingByEvent, addComment, deleteComment, getInstagramTimetableData } from './actions'
import { cleanupDatabase, createTestUser, createTestEvent, createTestParticipation, createTestComment, getTestDb } from '@/tests/helpers/db'
import { resetAuthMocks, mockRegularUserAuth, mockUnauthenticated, mockCurrentUserData, createMockUser } from '@/tests/helpers/auth'
import { resetEmailMocks, getSentEmails, wasEmailSent } from '@/tests/helpers/email'
import { createBookingFormData } from '@/tests/helpers/form-data'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { events, participations, comments, users } from '@/db/schema'

// Mock revalidatePath
vi.mock('next/cache')

describe('createBooking', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully create booking with valid data', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1' })
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')
    mockCurrentUserData(createMockUser({
      id: 'test-user-1',
      firstName: 'Test',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    }))

    const formData = createBookingFormData({
      eventId: event.id.toString(),
      name: 'Test Participant',
      email: 'participant@example.com',
    })

    const result = await createBooking(formData)

    expect(result.success).toBe(true)
    expect(result.participationId).toBeDefined()
    expect(result.confirmationToken).toBeDefined()

    // Verify participation was created
    const db = getTestDb()
    const participationsList = await db
      .select()
      .from(participations)
      .where(eq(participations.eventId, event.id))
    
    expect(participationsList).toHaveLength(1)
    expect(participationsList[0].participantName).toBe('Test Participant')
    expect(participationsList[0].participantEmail).toBe('participant@example.com')

    // Verify event booking count was updated
    const updatedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)
    
    expect(updatedEvent[0].currentBookings).toBe(1)

    // Verify emails were sent
    expect(wasEmailSent('booking-confirmation', 'participant@example.com')).toBe(true)
    expect(wasEmailSent('admin-notification')).toBe(true)

    // Verify paths were revalidated
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should use Clerk user data when available', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1', displayName: 'Clerk Display Name' })
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')
    mockCurrentUserData(createMockUser({
      id: 'test-user-1',
      firstName: 'Clerk',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'clerk@example.com' }],
    }))

    const formData = createBookingFormData({
      eventId: event.id.toString(),
      name: 'Form Name', // Should be overridden by Clerk data
      email: 'form@example.com', // Should be overridden by Clerk data
    })

    const result = await createBooking(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const participationsList = await db
      .select()
      .from(participations)
      .where(eq(participations.eventId, event.id))
    
    // Should use displayName from database if available, otherwise Clerk firstName
    expect(participationsList[0].participantName).toBe('Clerk Display Name')
    expect(participationsList[0].participantEmail).toBe('clerk@example.com')
  })

  it('should fall back to form data when Clerk data unavailable', async () => {
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')
    mockCurrentUserData(null) // No Clerk user data

    const formData = createBookingFormData({
      eventId: event.id.toString(),
      name: 'Form Name',
      email: 'form@example.com',
    })

    const result = await createBooking(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const participationsList = await db
      .select()
      .from(participations)
      .where(eq(participations.eventId, event.id))
    
    expect(participationsList[0].participantName).toBe('Form Name')
    expect(participationsList[0].participantEmail).toBe('form@example.com')
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    mockUnauthenticated()

    const formData = createBookingFormData({
      eventId: event.id.toString(),
    })

    const result = await createBooking(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when event does not exist', async () => {
    mockRegularUserAuth('test-user-1')

    const formData = createBookingFormData({
      eventId: '99999',
    })

    const result = await createBooking(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should fail when required fields are missing', async () => {
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')
    mockCurrentUserData(null)

    const formData = createBookingFormData({
      eventId: event.id.toString(),
      name: '',
      email: '',
    })

    const result = await createBooking(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('required fields')
  })

  it('should handle email failures gracefully', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1' })
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')
    mockCurrentUserData(createMockUser({
      id: 'test-user-1',
      firstName: 'Test',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    }))

    // Mock email functions to throw errors
    const { sendBookingConfirmationEmail, sendAdminNotificationEmail } = await import('@/lib/email')
    vi.mocked(sendBookingConfirmationEmail).mockRejectedValueOnce(new Error('Email failed'))
    vi.mocked(sendAdminNotificationEmail).mockRejectedValueOnce(new Error('Email failed'))

    const formData = createBookingFormData({
      eventId: event.id.toString(),
    })

    // Should still succeed even if emails fail
    const result = await createBooking(formData)

    expect(result.success).toBe(true)
  })
})

describe('cancelBooking', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully cancel own booking', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1' })
    const event = await createTestEvent()
    const participation = await createTestParticipation(event.id, {
      clerkUserId: 'test-user-1',
    })
    mockRegularUserAuth('test-user-1')

    const result = await cancelBooking(participation.id)

    expect(result.success).toBe(true)

    // Verify participation was deleted
    const db = getTestDb()
    const participationsList = await db
      .select()
      .from(participations)
      .where(eq(participations.id, participation.id))
    
    expect(participationsList).toHaveLength(0)

    // Verify event booking count was decremented
    const updatedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)
    
    expect(updatedEvent[0].currentBookings).toBe(0)

    // Verify paths were revalidated
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    const participation = await createTestParticipation(event.id)
    mockUnauthenticated()

    const result = await cancelBooking(participation.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when participation not found', async () => {
    mockRegularUserAuth('test-user-1')

    const result = await cancelBooking(99999)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should fail when trying to cancel someone else\'s booking', async () => {
    const event = await createTestEvent()
    const participation = await createTestParticipation(event.id, {
      clerkUserId: 'other-user',
    })
    mockRegularUserAuth('test-user-1') // Different user

    const result = await cancelBooking(participation.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })
})

describe('cancelBookingByEvent', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully cancel booking by event ID', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1' })
    const event = await createTestEvent()
    const participation = await createTestParticipation(event.id, {
      clerkUserId: 'test-user-1',
    })
    mockRegularUserAuth('test-user-1')

    const result = await cancelBookingByEvent(event.id)

    expect(result.success).toBe(true)

    // Verify participation was deleted
    const db = getTestDb()
    const participationsList = await db
      .select()
      .from(participations)
      .where(eq(participations.eventId, event.id))
    
    expect(participationsList).toHaveLength(0)
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    mockUnauthenticated()

    const result = await cancelBookingByEvent(event.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when no participation found for event', async () => {
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')

    const result = await cancelBookingByEvent(event.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })
})

describe('addComment', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully add comment', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1', displayName: 'Test Author' })
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')
    mockCurrentUserData(createMockUser({
      id: 'test-user-1',
      firstName: 'Test',
      emailAddresses: [{ emailAddress: 'author@example.com' }],
    }))

    const result = await addComment(event.id, 'Test comment content')

    expect(result.success).toBe(true)
    expect(result.commentId).toBeDefined()

    // Verify comment was created
    const db = getTestDb()
    const commentsList = await db
      .select()
      .from(comments)
      .where(eq(comments.eventId, event.id))
    
    expect(commentsList).toHaveLength(1)
    expect(commentsList[0].content).toBe('Test comment content')
    expect(commentsList[0].authorName).toBe('Test Author') // Should use displayName from DB

    // Verify paths were revalidated
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('should send notification emails to participants and instructor', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      email: 'instructor@example.com',
      displayName: 'Instructor',
    })
    const participant = await createTestUser({ clerkUserId: 'participant-user' })
    const event = await createTestEvent({ instructorId: instructor.id })
    await createTestParticipation(event.id, {
      clerkUserId: 'participant-user',
      participantEmail: 'participant@example.com',
    })
    
    mockRegularUserAuth('comment-author')
    mockCurrentUserData(createMockUser({
      id: 'comment-author',
      firstName: 'Comment',
      lastName: 'Author',
      emailAddresses: [{ emailAddress: 'author@example.com' }],
    }))

    const result = await addComment(event.id, 'Test comment')

    expect(result.success).toBe(true)

    // Verify emails were sent (excluding the comment author)
    const sentEmails = getSentEmails()
    const commentEmails = sentEmails.filter(e => e.type === 'comment-notification')
    expect(commentEmails.length).toBeGreaterThan(0)
    expect(commentEmails.some(e => e.to === 'participant@example.com')).toBe(true)
    expect(commentEmails.some(e => e.to === 'instructor@example.com')).toBe(true)
    expect(commentEmails.some(e => e.to === 'author@example.com')).toBe(false) // Author should not receive email
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    mockUnauthenticated()

    const result = await addComment(event.id, 'Test comment')

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when event does not exist', async () => {
    mockRegularUserAuth('test-user-1')

    const result = await addComment(99999, 'Test comment')

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should fail when comment is empty', async () => {
    const event = await createTestEvent()
    mockRegularUserAuth('test-user-1')

    const result = await addComment(event.id, '   ')

    expect(result.success).toBe(false)
    expect(result.error).toContain('empty')
  })
})

describe('deleteComment', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully delete own comment', async () => {
    const user = await createTestUser({ clerkUserId: 'test-user-1' })
    const event = await createTestEvent()
    const comment = await createTestComment(event.id, 'test-user-1')
    mockRegularUserAuth('test-user-1')

    const result = await deleteComment(comment.id)

    expect(result.success).toBe(true)

    // Verify comment was deleted
    const db = getTestDb()
    const commentsList = await db
      .select()
      .from(comments)
      .where(eq(comments.id, comment.id))
    
    expect(commentsList).toHaveLength(0)

    // Verify paths were revalidated
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    const comment = await createTestComment(event.id, 'test-user-1')
    mockUnauthenticated()

    const result = await deleteComment(comment.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when comment not found', async () => {
    mockRegularUserAuth('test-user-1')

    const result = await deleteComment(99999)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should fail when trying to delete someone else\'s comment', async () => {
    const event = await createTestEvent()
    const comment = await createTestComment(event.id, 'other-user')
    mockRegularUserAuth('test-user-1') // Different user

    const result = await deleteComment(comment.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })
})

describe('getInstagramTimetableData', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    vi.clearAllMocks()
  })

  it('should return correct timetable data for paradise-stage', async () => {
    const event = await createTestEvent({
      location: 'paradise-stage',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00:00',
      endTime: '16:00:00',
      isPublished: true,
    })

    const result = await getInstagramTimetableData(undefined, 'paradise-stage')

    expect(result.title).toContain('PARADISE STAGE')
    expect(result.days).toHaveLength(7)
    expect(result.timeSlots.length).toBeGreaterThan(0)
    expect(result.events).toBeDefined()
  })

  it('should return correct timetable data for paradise-river', async () => {
    const event = await createTestEvent({
      location: 'paradise-river',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00:00',
      endTime: '16:00:00',
      isPublished: true,
    })

    const result = await getInstagramTimetableData(undefined, 'paradise-river')

    expect(result.title).toContain('PARADISE RIVER')
    expect(result.days).toHaveLength(7)
  })

  it('should calculate correct week range (Monday-Sunday)', async () => {
    // Create a date that's a Wednesday
    const wednesday = new Date('2026-01-21') // Assuming this is a Wednesday
    const result = await getInstagramTimetableData(wednesday.toISOString().split('T')[0])

    expect(result.days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })

  it('should handle special events (FIRESHOW, OPEN MIC, etc.)', async () => {
    const event = await createTestEvent({
      title: 'FIRESHOW Performance',
      location: 'paradise-stage',
      date: new Date().toISOString().split('T')[0],
      startTime: '20:00:00',
      endTime: '22:00:00',
      isPublished: true,
    })

    const result = await getInstagramTimetableData(undefined, 'paradise-stage')
    
    const eventKey = Object.keys(result.events).find(key => 
      result.events[key]?.name === 'FIRESHOW Performance'
    )
    
    expect(eventKey).toBeDefined()
    expect(result.events[eventKey!]?.isSpecial).toBe(true)
  })
})
