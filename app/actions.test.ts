import { describe, it, expect, beforeEach, vi } from "vitest"
import { getInstagramTimetableData } from "./actions"
import { cleanupDatabase, createTestEvent } from "@/tests/helpers/db"
import { resetAuthMocks } from "@/tests/helpers/auth"

// Mock next/cache - unstable_cache must return a function that executes the callback
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => Promise<unknown>) => fn),
}))

describe("getInstagramTimetableData", () => {
  beforeEach(async () => {
    await cleanupDatabase()
    resetAuthMocks()
    vi.clearAllMocks()
  })

  it("should return correct timetable data for paradise-stage", async () => {
    const event = await createTestEvent({
      location: "paradise stage",
      date: new Date().toISOString().split("T")[0],
      startTime: "14:00:00",
      endTime: "16:00:00",
      isPublished: true,
    })

    const result = await getInstagramTimetableData(undefined, "paradise-stage")

    expect(result.title).toContain("PARADISE STAGE")
    expect(result.days).toHaveLength(7)
    expect(result.timeSlots.length).toBeGreaterThan(0)
    expect(result.events).toBeDefined()
  })

  it("should return correct timetable data for paradise-river", async () => {
    const event = await createTestEvent({
      location: "paradise-river",
      date: new Date().toISOString().split("T")[0],
      startTime: "14:00:00",
      endTime: "16:00:00",
      isPublished: true,
    })

    const result = await getInstagramTimetableData(undefined, "paradise-river")

    expect(result.title).toContain("PARADISE RIVER")
    expect(result.days).toHaveLength(7)
  })

  it("should calculate correct week range (Monday-Sunday)", async () => {
    // Create a date that's a Wednesday
    const wednesday = new Date("2026-01-21") // Assuming this is a Wednesday
    const result = await getInstagramTimetableData(
      wednesday.toISOString().split("T")[0],
    )

    expect(result.days).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ])
  })

  it("should handle special events (FIRESHOW, OPEN MIC, etc.)", async () => {
    const event = await createTestEvent({
      title: "FIRESHOW Performance",
      location: "paradise-stage",
      date: new Date().toISOString().split("T")[0],
      startTime: "20:00:00",
      endTime: "22:00:00",
      isPublished: true,
    })

    const result = await getInstagramTimetableData(undefined, "paradise-stage")

    const eventKey = Object.keys(result.events).find(
      (key) => result.events[key]?.name === "FIRESHOW Performance",
    )

    expect(eventKey).toBeDefined()
    expect(result.events[eventKey!]?.isSpecial).toBe(true)
  })
})
