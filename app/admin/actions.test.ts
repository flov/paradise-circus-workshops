import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createEvent,
  approveEvent,
  updateEvent,
  deleteEvent,
  deleteBooking,
  extendRecurringEvents,
} from './actions'
import {
  cleanupDatabase,
  createTestUser,
  createTestEvent,
  createTestParticipation,
  getTestDb,
} from '@/tests/helpers/db'
import {
  resetAuthMocks,
  mockAdminAuth,
  mockInstructorAuth,
  mockRegularUserAuth,
  mockUnauthenticated,
  mockCurrentUserData,
  createMockUser,
} from '@/tests/helpers/auth'
import { resetEmailMocks, wasEmailSent, getSentEmails } from '@/tests/helpers/email'
import { createEventFormData, createEventUpdateFormData } from '@/tests/helpers/form-data'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { events, participations } from '@/db/schema'
import { randomUUID } from 'crypto'
import { isAdmin, isInstructor, getAllAdmins } from '@/app/profile/actions'

vi.mock('next/cache')

describe('createEvent', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
    vi.mocked(getAllAdmins).mockResolvedValue([])
  })

  it('should allow admin to create published event', async () => {
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formData = createEventFormData({
      date: tomorrow.toISOString().split('T')[0],
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const createdEvents = await db
      .select()
      .from(events)
      .where(eq(events.title, 'Test Event'))
      .limit(1)

    expect(createdEvents).toHaveLength(1)
    expect(createdEvents[0].isPublished).toBe(true)
  })

  it('should allow instructor to create unpublished event', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
      email: 'instructor@example.com',
    })
    mockInstructorAuth('instructor-user')
    mockCurrentUserData(createMockUser({
      id: 'instructor-user',
      firstName: 'Instructor',
      emailAddresses: [{ emailAddress: 'instructor@example.com' }],
    }))
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)
    vi.mocked(getAllAdmins).mockResolvedValue([
      { id: 1, email: 'admin@example.com', displayName: 'Admin', username: 'admin' },
    ])

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formData = createEventFormData({
      date: tomorrow.toISOString().split('T')[0],
      instructorId: instructor.id.toString(),
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const createdEvents = await db
      .select()
      .from(events)
      .where(eq(events.title, 'Test Event'))
      .limit(1)

    expect(createdEvents).toHaveLength(1)
    expect(createdEvents[0].isPublished).toBe(false)
    expect(wasEmailSent('event-pending-approval')).toBe(true)
    expect(wasEmailSent('admin-event-pending')).toBe(true)
  })

  it('should create recurring events correctly', async () => {
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(tomorrow)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const formData = createEventFormData({
      date: tomorrow.toISOString().split('T')[0],
      isRecurring: 'on',
      recurUntil: nextWeek.toISOString().split('T')[0],
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const createdEvents = await db
      .select()
      .from(events)
      .where(eq(events.title, 'Test Event'))
      .orderBy(events.date)

    expect(createdEvents.length).toBeGreaterThan(1)
    expect(createdEvents.every(e => e.isRecurring)).toBe(true)
    expect(createdEvents.every(e => e.recurringSeriesId === createdEvents[0].recurringSeriesId)).toBe(true)
  })

  it('should fail when not authenticated', async () => {
    mockUnauthenticated()

    const formData = createEventFormData()

    const result = await createEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when not admin/instructor', async () => {
    mockRegularUserAuth('regular-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const formData = createEventFormData()

    const result = await createEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('instructors and admins')
  })

  it('should fail when instructor tries to create recurring event', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
    })
    mockInstructorAuth('instructor-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formData = createEventFormData({
      date: tomorrow.toISOString().split('T')[0],
      isRecurring: 'on',
      instructorId: instructor.id.toString(),
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only admins can create recurring events')
  })

  it('should validate required fields', async () => {
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const formData = createEventFormData({
      title: '',
      date: '',
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('required fields')
  })

  it('should fail when recurUntil is before start date', async () => {
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const formData = createEventFormData({
      date: tomorrow.toISOString().split('T')[0],
      isRecurring: 'on',
      recurUntil: yesterday.toISOString().split('T')[0],
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('after the start date')
  })

  it('should fail when recurring period exceeds 1 year', async () => {
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const oneYearPlus = new Date(tomorrow)
    oneYearPlus.setFullYear(oneYearPlus.getFullYear() + 1)
    oneYearPlus.setDate(oneYearPlus.getDate() + 1) // One day over 1 year

    const formData = createEventFormData({
      date: tomorrow.toISOString().split('T')[0],
      isRecurring: 'on',
      recurUntil: oneYearPlus.toISOString().split('T')[0],
    })

    const result = await createEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('cannot exceed 1 year')
  })
})

describe('approveEvent', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should allow admin to approve unpublished event', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
      email: 'instructor@example.com',
    })
    const event = await createTestEvent({
      isPublished: false,
      instructorId: instructor.id,
    })
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)

    const result = await approveEvent(event.id)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const updatedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)

    expect(updatedEvent[0].isPublished).toBe(true)
    expect(wasEmailSent('event-approved', 'instructor@example.com')).toBe(true)
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent({ isPublished: false })
    mockUnauthenticated()

    const result = await approveEvent(event.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('signed in')
  })

  it('should fail when not admin', async () => {
    const event = await createTestEvent({ isPublished: false })
    mockRegularUserAuth('regular-user')
    vi.mocked(isAdmin).mockResolvedValue(false)

    const result = await approveEvent(event.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only admins')
  })

  it('should fail when event not found', async () => {
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)

    const result = await approveEvent(99999)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should no-op when event already published', async () => {
    const event = await createTestEvent({ isPublished: true })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)

    const result = await approveEvent(event.id)

    expect(result.success).toBe(true)
    expect(result.message).toContain('already published')
  })
})

describe('updateEvent', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should allow admin to update any event', async () => {
    const event = await createTestEvent()
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const formData = createEventUpdateFormData(event.id, {
      title: 'Updated Title',
    })

    const result = await updateEvent(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const updatedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)

    expect(updatedEvent[0].title).toBe('Updated Title')
  })

  it('should allow instructor to update own event', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
    })
    const event = await createTestEvent({
      instructorId: instructor.id,
    })
    mockInstructorAuth('instructor-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)

    const formData = createEventUpdateFormData(event.id, {
      title: 'Updated Title',
      instructorId: instructor.id.toString(),
    })

    const result = await updateEvent(formData)

    expect(result.success).toBe(true)
  })

  it('should update recurring event series correctly', async () => {
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)
    vi.mocked(isInstructor).mockResolvedValue(false)

    const seriesId = randomUUID()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(tomorrow)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Create recurring series
    const event1 = await createTestEvent({
      title: 'Recurring Event',
      date: tomorrow.toISOString().split('T')[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    })
    await createTestEvent({
      title: 'Recurring Event',
      date: nextWeek.toISOString().split('T')[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    })

    const formData = createEventUpdateFormData(event1.id, {
      title: 'Updated Recurring Event',
      isRecurring: 'on',
    })

    const result = await updateEvent(formData)

    expect(result.success).toBe(true)

    const db = getTestDb()
    const updatedEvents = await db
      .select()
      .from(events)
      .where(eq(events.recurringSeriesId, seriesId))

    expect(updatedEvents.every(e => e.title === 'Updated Recurring Event')).toBe(true)
  })

  it('should fail when instructor tries to update someone else\'s event', async () => {
    const otherInstructor = await createTestUser({
      clerkUserId: 'other-instructor',
      isInstructor: true,
    })
    const event = await createTestEvent({
      instructorId: otherInstructor.id,
    })
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
    })
    mockInstructorAuth('instructor-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)

    const formData = createEventUpdateFormData(event.id, {
      instructorId: instructor.id.toString(),
    })

    const result = await updateEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  it('should fail when instructor tries to update recurring event', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
    })
    const seriesId = randomUUID()
    const event = await createTestEvent({
      instructorId: instructor.id,
      recurringSeriesId: seriesId,
      isRecurring: true,
    })
    mockInstructorAuth('instructor-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)

    const formData = createEventUpdateFormData(event.id, {
      instructorId: instructor.id.toString(),
    })

    const result = await updateEvent(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only admins can update recurring events')
  })
})

describe('deleteEvent', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should allow admin to delete any event', async () => {
    const event = await createTestEvent()
    const participant = await createTestParticipation(event.id, {
      participantEmail: 'participant@example.com',
    })
    const admin = await createTestUser({
      clerkUserId: 'admin-user',
      isAdmin: true,
    })
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)

    await deleteEvent(event.id)

    const db = getTestDb()
    const deletedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)

    expect(deletedEvent).toHaveLength(0)
    expect(wasEmailSent('event-cancelled', 'participant@example.com')).toBe(true)
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('should allow instructor to delete own event', async () => {
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
    })
    const event = await createTestEvent({
      instructorId: instructor.id,
    })
    mockInstructorAuth('instructor-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)

    await deleteEvent(event.id)

    const db = getTestDb()
    const deletedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)

    expect(deletedEvent).toHaveLength(0)
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    mockUnauthenticated()

    await expect(deleteEvent(event.id)).rejects.toThrow('signed in')
  })

  it('should fail when instructor tries to delete someone else\'s event', async () => {
    const otherInstructor = await createTestUser({
      clerkUserId: 'other-instructor',
      isInstructor: true,
    })
    const event = await createTestEvent({
      instructorId: otherInstructor.id,
    })
    const instructor = await createTestUser({
      clerkUserId: 'instructor-user',
      isInstructor: true,
    })
    mockInstructorAuth('instructor-user')
    vi.mocked(isAdmin).mockResolvedValue(false)
    vi.mocked(isInstructor).mockResolvedValue(true)

    await expect(deleteEvent(event.id)).rejects.toThrow('Unauthorized')
  })
})

describe('deleteBooking', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully delete booking', async () => {
    const event = await createTestEvent()
    const participation = await createTestParticipation(event.id)
    mockAdminAuth('admin-user')
    vi.mocked(isAdmin).mockResolvedValue(true)

    await deleteBooking(participation.id, event.id)

    const db = getTestDb()
    const deletedParticipation = await db
      .select()
      .from(participations)
      .where(eq(participations.id, participation.id))
      .limit(1)

    expect(deletedParticipation).toHaveLength(0)

    const updatedEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, event.id))
      .limit(1)

    expect(updatedEvent[0].currentBookings).toBe(0)
  })

  it('should fail when not authenticated', async () => {
    const event = await createTestEvent()
    const participation = await createTestParticipation(event.id)
    mockUnauthenticated()

    await expect(deleteBooking(participation.id, event.id)).rejects.toThrow('signed in')
  })
})

describe('extendRecurringEvents', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should create events for series that need extension', async () => {
    const seriesId = randomUUID()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Create a recurring event that ends yesterday (needs extension)
    await createTestEvent({
      title: 'Recurring Event',
      date: yesterday.toISOString().split('T')[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    })

    const result = await extendRecurringEvents()

    expect(result.success).toBe(true)
    expect(result.eventsCreated).toBeGreaterThan(0)
    expect(result.seriesProcessed).toBe(1)

    const db = getTestDb()
    const extendedEvents = await db
      .select()
      .from(events)
      .where(eq(events.recurringSeriesId, seriesId))
      .orderBy(events.date)

    // Should have created events up to at least 1 week ahead
    const latestDate = new Date(extendedEvents[extendedEvents.length - 1].date)
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + 7)
    expect(latestDate >= targetDate).toBe(true)
  })

  it('should skip series that already have enough events', async () => {
    const seriesId = randomUUID()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Create a recurring event that already extends into next week
    await createTestEvent({
      title: 'Recurring Event',
      date: nextWeek.toISOString().split('T')[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    })

    const result = await extendRecurringEvents()

    expect(result.success).toBe(true)
    expect(result.eventsCreated).toBe(0) // No new events needed
    expect(result.seriesProcessed).toBe(1)
  })

  it('should avoid duplicate events', async () => {
    const seriesId = randomUUID()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Create event ending yesterday
    await createTestEvent({
      title: 'Recurring Event',
      date: yesterday.toISOString().split('T')[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    })

    // Run extension twice
    await extendRecurringEvents()
    const result = await extendRecurringEvents()

    expect(result.success).toBe(true)
    // Second run should not create duplicates
    expect(result.eventsCreated).toBe(0)
  })

  it('should handle multiple recurring series', async () => {
    const seriesId1 = randomUUID()
    const seriesId2 = randomUUID()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await createTestEvent({
      title: 'Series 1',
      date: yesterday.toISOString().split('T')[0],
      recurringSeriesId: seriesId1,
      isRecurring: true,
    })

    await createTestEvent({
      title: 'Series 2',
      date: yesterday.toISOString().split('T')[0],
      recurringSeriesId: seriesId2,
      isRecurring: true,
    })

    const result = await extendRecurringEvents()

    expect(result.success).toBe(true)
    expect(result.seriesProcessed).toBe(2)
    expect(result.eventsCreated).toBeGreaterThan(0)
  })

  it('should revalidate paths', async () => {
    const seriesId = randomUUID()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await createTestEvent({
      date: yesterday.toISOString().split('T')[0],
      recurringSeriesId: seriesId,
      isRecurring: true,
    })

    await extendRecurringEvents()

    expect(revalidatePath).toHaveBeenCalledWith('/admin')
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/api/timetable')
  })
})
