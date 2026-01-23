import { vi } from 'vitest'

// Mock Clerk before importing
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'

type MockUser = {
  id: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  emailAddresses?: Array<{ emailAddress: string }>
  imageUrl?: string | null
}

let mockAuthUserId: string | null = null
let mockCurrentUser: MockUser | null = null

/**
 * Reset auth mocks
 */
export function resetAuthMocks() {
  mockAuthUserId = null
  mockCurrentUser = null
  vi.mocked(auth).mockResolvedValue({
    userId: undefined,
    sessionId: undefined,
    orgId: undefined,
    orgRole: undefined,
    orgSlug: undefined,
    actor: undefined,
  } as Awaited<ReturnType<typeof auth>>)
  vi.mocked(currentUser).mockResolvedValue(null)
}

/**
 * Mock authentication as a specific user
 */
export function mockAuth(userId: string | null) {
  mockAuthUserId = userId
  vi.mocked(auth).mockResolvedValue({
    userId: mockAuthUserId || undefined,
    sessionId: mockAuthUserId ? 'test-session-id' : undefined,
    orgId: undefined,
    orgRole: undefined,
    orgSlug: undefined,
    actor: undefined,
  } as Awaited<ReturnType<typeof auth>>)
}

/**
 * Mock current user data
 */
export function mockCurrentUserData(user: MockUser | null) {
  mockCurrentUser = user
  if (user) {
    vi.mocked(currentUser).mockResolvedValue({
      id: user.id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      username: user.username || null,
      emailAddresses: user.emailAddresses || [],
      imageUrl: user.imageUrl || null,
    } as Awaited<ReturnType<typeof currentUser>>)
  } else {
    vi.mocked(currentUser).mockResolvedValue(null)
  }
}

/**
 * Helper to create a mock user
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: `user_${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    imageUrl: null,
    ...overrides,
  }
}

/**
 * Set up authentication as admin user
 */
export function mockAdminAuth(userId: string = 'admin-user-id') {
  mockAuth(userId)
  mockCurrentUserData(createMockUser({
    id: userId,
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    emailAddresses: [{ emailAddress: 'admin@example.com' }],
  }))
}

/**
 * Set up authentication as instructor user
 */
export function mockInstructorAuth(userId: string = 'instructor-user-id') {
  mockAuth(userId)
  mockCurrentUserData(createMockUser({
    id: userId,
    firstName: 'Instructor',
    lastName: 'User',
    username: 'instructor',
    emailAddresses: [{ emailAddress: 'instructor@example.com' }],
  }))
}

/**
 * Set up authentication as regular user
 */
export function mockRegularUserAuth(userId: string = 'regular-user-id') {
  mockAuth(userId)
  mockCurrentUserData(createMockUser({
    id: userId,
    firstName: 'Regular',
    lastName: 'User',
    username: 'regularuser',
    emailAddresses: [{ emailAddress: 'user@example.com' }],
  }))
}

/**
 * Set up unauthenticated state
 */
export function mockUnauthenticated() {
  mockAuth(null)
  mockCurrentUserData(null)
}
