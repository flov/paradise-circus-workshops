import { vi } from 'vitest'
import * as path from 'path'

// Set up environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || ''
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-resend-key'
process.env.RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'test@example.com'
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
process.env.NODE_ENV = 'test'

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    headers = new Map()
    constructor(init?: { headers?: HeadersInit }) {
      this.headers = new Map()
      if (init?.headers) {
        const headers = new Headers(init.headers)
        headers.forEach((value, key) => {
          this.headers.set(key, value)
        })
      }
    }
    get(name: string) {
      return this.headers.get(name)
    }
  },
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

// Mock profile actions (isAdmin, isInstructor, getAllAdmins)
vi.mock('@/app/profile/actions', async () => {
  const actual = await vi.importActual<typeof import('@/app/profile/actions')>('@/app/profile/actions')
  return {
    ...actual,
    isAdmin: vi.fn(),
    isInstructor: vi.fn(),
    getAllAdmins: vi.fn(),
  }
})
