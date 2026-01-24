/**
 * Helper to create FormData objects for testing server actions
 */
export function createFormData(data: Record<string, string | null | undefined>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      formData.append(key, value)
    }
  }
  return formData
}

/**
 * Helper to create FormData for booking
 */
export function createBookingFormData(overrides: Partial<{
  eventId: string
  name: string
  email: string
  phone: string
  notes: string
}> = {}): FormData {
  return createFormData({
    eventId: '1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    notes: '',
    ...overrides,
  })
}

/**
 * Helper to create FormData for event creation
 */
export function createEventFormData(overrides: Partial<{
  title: string
  description: string
  instructor: string
  instructorId: string
  date: string
  start_time: string
  end_time: string
  location: string
  whatToBring: string
  propId: string
  isWorkshop: string
  isRecurring: string
}> = {}): FormData {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return createFormData({
    title: 'Test Event',
    description: 'Test Description',
    instructor: 'Test Instructor',
    instructorId: '',
    date: tomorrow.toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '12:00',
    location: 'Test Location',
    whatToBring: '',
    propId: '',
    isWorkshop: 'on',
    isRecurring: 'false',
    ...overrides,
  })
}

/**
 * Helper to create FormData for event update
 */
export function createEventUpdateFormData(
  eventId: number,
  overrides: Partial<{
    title: string
    description: string
    instructor: string
    instructorId: string
    date: string
    start_time: string
    end_time: string
    location: string
    whatToBring: string
    propId: string
    isWorkshop: string
    isPublished: string
    isRecurring: string
  }> = {}
): FormData {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return createFormData({
    id: eventId.toString(),
    title: 'Updated Test Event',
    description: 'Updated Description',
    instructor: 'Updated Instructor',
    instructorId: '',
    date: tomorrow.toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '16:00',
    location: 'Updated Location',
    whatToBring: '',
    propId: '',
    isWorkshop: 'on',
    isPublished: 'on',
    isRecurring: 'false',
    ...overrides,
  })
}
