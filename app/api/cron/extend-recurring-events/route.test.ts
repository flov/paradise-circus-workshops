import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'
import { extendRecurringEvents } from '@/app/admin/actions'
import { cleanupDatabase, createTestEvent, getTestDb } from '@/tests/helpers/db'
import { resetAuthMocks } from '@/tests/helpers/auth'
import { resetEmailMocks } from '@/tests/helpers/email'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { events } from '@/db/schema'

vi.mock('@/app/admin/actions', () => ({
  extendRecurringEvents: vi.fn(),
}))

describe('GET /api/cron/extend-recurring-events', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    resetEmailMocks()
    vi.clearAllMocks()
  })

  it('should successfully call extendRecurringEvents', async () => {
    vi.mocked(extendRecurringEvents).mockResolvedValue({
      success: true,
      eventsCreated: 5,
      seriesProcessed: 2,
    })

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events', {
      headers: {
        'x-vercel-cron': 'true',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(extendRecurringEvents).toHaveBeenCalled()
    expect(data.success).toBe(true)
    expect(data.eventsCreated).toBe(5)
    expect(data.seriesProcessed).toBe(2)
  })

  it('should return success response with counts', async () => {
    vi.mocked(extendRecurringEvents).mockResolvedValue({
      success: true,
      eventsCreated: 10,
      seriesProcessed: 3,
    })

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events', {
      headers: {
        'x-vercel-cron': 'true',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('successfully')
    expect(data.eventsCreated).toBe(10)
    expect(data.seriesProcessed).toBe(3)
  })

  it('should verify Vercel Cron header in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events')
    // No x-vercel-cron header

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Unauthorized')

    process.env.NODE_ENV = originalEnv
  })

  it('should allow direct access in development', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    vi.mocked(extendRecurringEvents).mockResolvedValue({
      success: true,
      eventsCreated: 0,
      seriesProcessed: 0,
    })

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events')
    // No x-vercel-cron header, but should work in development

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    process.env.NODE_ENV = originalEnv
  })

  it('should return error response on failure', async () => {
    vi.mocked(extendRecurringEvents).mockResolvedValue({
      success: false,
      error: 'Database error',
      eventsCreated: 0,
      seriesProcessed: 0,
    })

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events', {
      headers: {
        'x-vercel-cron': 'true',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database error')
  })

  it('should handle exceptions gracefully', async () => {
    vi.mocked(extendRecurringEvents).mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events', {
      headers: {
        'x-vercel-cron': 'true',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should reject requests without cron header in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events')
    // Explicitly no header

    const response = await GET(request)

    expect(response.status).toBe(401)

    process.env.NODE_ENV = originalEnv
  })

  it('should return 500 on internal errors', async () => {
    vi.mocked(extendRecurringEvents).mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const request = new NextRequest('http://localhost/api/cron/extend-recurring-events', {
      headers: {
        'x-vercel-cron': 'true',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })
})
