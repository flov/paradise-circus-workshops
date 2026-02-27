"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  getAllProps,
  getCurrentUserProfile,
  getAllInstructors,
} from "@/app/profile/actions"
import type { UserDisplayInfo } from "@/db/schema"

export type EventFormInitialValues = {
  id?: number
  title?: string
  description?: string
  instructor?: string
  instructorId?: number | null
  date?: string
  startTime?: string
  endTime?: string
  location?: string | null
  whatToBring?: string | null
  isWorkshop?: boolean
  level?: string | null
  isPublished?: boolean
  propId?: number | null
  isRecurring?: boolean
  recurringUntil?: string
  createdAt?: string | Date
  lastUpdatedByUser?: UserDisplayInfo | null
  approvedByUser?: UserDisplayInfo | null
}

type EventFormProps = {
  initialValues?: EventFormInitialValues
  isSubmitting: boolean
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  error: string | null
  submitButtonText?: string
  submittingText?: string
  onDelete?: (
    eventId: number,
    cancellationMessage?: string | null,
  ) => Promise<void>
  onDeleteAllFuture?: (
    eventId: number,
    cancellationMessage?: string | null,
  ) => Promise<void>
}

export function EventForm({
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
  error,
  submitButtonText = "Save Event",
  submittingText = "Saving...",
  onDelete,
  onDeleteAllFuture,
}: EventFormProps) {
  const [availableProps, setAvailableProps] = useState<
    Array<{ id: number; name: string }>
  >([])
  const [selectedPropId, setSelectedPropId] = useState<number | null>(null)
  const [userProfile, setUserProfile] = useState<{
    id: number
    displayName: string | null
    username: string
    isAdmin: boolean
    isInstructor: boolean
  } | null>(null)
  const [instructors, setInstructors] = useState<
    Array<{ id: number; displayName: string | null; username: string }>
  >([])
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null)
  const [isWorkshop, setIsWorkshop] = useState<boolean>(
    initialValues?.isWorkshop ?? true,
  )
  const [level, setLevel] = useState<string>(
    initialValues?.level ?? "All levels",
  )
  const [isRecurring, setIsRecurring] = useState<boolean>(
    initialValues?.isRecurring ?? false,
  )
  // Initialize recurringUntil - handle both string and undefined/null
  const getInitialRecurringUntil = (): string => {
    if (!initialValues?.recurringUntil) return ""
    if (typeof initialValues.recurringUntil === "string") {
      // If it has time component, extract date part
      if (
        initialValues.recurringUntil.includes("T") ||
        initialValues.recurringUntil.includes(" ")
      ) {
        return new Date(initialValues.recurringUntil)
          .toISOString()
          .split("T")[0]
      }
      // Already in YYYY-MM-DD format
      return initialValues.recurringUntil
    }
    // Date object
    return new Date(initialValues.recurringUntil).toISOString().split("T")[0]
  }
  const [recurringUntil, setRecurringUntil] = useState<string>(
    getInitialRecurringUntil(),
  )
  const [recurringValidationError, setRecurringValidationError] = useState<
    string | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeletingAllFuture, setIsDeletingAllFuture] = useState(false)
  const [deleteAllFutureDialogOpen, setDeleteAllFutureDialogOpen] =
    useState(false)
  const [cancellationMessage, setCancellationMessage] = useState("")

  // Initialize date state
  const getInitialDate = (): string => {
    if (initialValues?.date) {
      return typeof initialValues.date === "string" &&
        initialValues.date.includes("T")
        ? new Date(initialValues.date).toISOString().split("T")[0]
        : initialValues.date
    }
    return ""
  }
  const [date, setDate] = useState<string>(getInitialDate())

  // Initialize location state based on initialValues
  const getInitialSelectedLocation = (): string => {
    const location = initialValues?.location || ""
    if (location === "Paradise Stage" || location === "Paradise River") {
      return location
    }
    return location ? "Other" : ""
  }
  const [selectedLocation, setSelectedLocation] = useState<string>(
    getInitialSelectedLocation(),
  )
  const [customLocation, setCustomLocation] = useState(
    initialValues?.location &&
      initialValues.location !== "Paradise Stage" &&
      initialValues.location !== "Paradise River"
      ? initialValues.location
      : "",
  )

  // Fetch available props, user profile, and instructors
  useEffect(() => {
    async function fetchData() {
      try {
        const propsList = await getAllProps()
        setAvailableProps(propsList)

        // Set the current propId from initialValues
        setSelectedPropId(initialValues?.propId || null)

        // Set the current instructorId from initialValues
        setSelectedInstructorId(initialValues?.instructorId || null)

        const profile = await getCurrentUserProfile()
        if (profile) {
          setUserProfile({
            id: profile.id,
            displayName: profile.displayName,
            username: profile.username,
            isAdmin: profile.isAdmin,
            isInstructor: profile.isInstructor,
          })

          // If user is instructor (not admin) and no instructorId in initialValues, set their id
          if (
            profile.isInstructor &&
            !profile.isAdmin &&
            !initialValues?.instructorId
          ) {
            setSelectedInstructorId(profile.id)
          }
        }

        // Fetch instructors for admin dropdown
        const instructorsList = await getAllInstructors()
        setInstructors(instructorsList)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [initialValues?.propId, initialValues?.instructorId])

  // Update location state when initialValues.location changes
  useEffect(() => {
    const location = initialValues?.location || ""
    if (location === "Paradise Stage" || location === "Paradise River") {
      setSelectedLocation(location)
      setCustomLocation("")
    } else if (location) {
      setSelectedLocation("Other")
      setCustomLocation(location)
    } else {
      setSelectedLocation("")
      setCustomLocation("")
    }
  }, [initialValues?.location])

  // Update recurringUntil state when initialValues.recurringUntil changes
  useEffect(() => {
    // Always update when initialValues changes, even if recurringUntil is undefined/null
    // This ensures the form resets when switching between events
    if (initialValues?.recurringUntil) {
      // recurringUntil from database is already in YYYY-MM-DD format (date type)
      // Only parse if it contains a time component (T) or is a Date object
      let recurringUntilDate: string
      if (typeof initialValues.recurringUntil === "string") {
        // Check if it's already in YYYY-MM-DD format (10 characters, no T)
        if (
          initialValues.recurringUntil.includes("T") ||
          initialValues.recurringUntil.includes(" ")
        ) {
          // Has time component or space, extract date part
          recurringUntilDate = new Date(initialValues.recurringUntil)
            .toISOString()
            .split("T")[0]
        } else {
          // Already in YYYY-MM-DD format, use directly
          recurringUntilDate = initialValues.recurringUntil
        }
      } else {
        // Date object, format it
        recurringUntilDate = new Date(initialValues.recurringUntil)
          .toISOString()
          .split("T")[0]
      }
      setRecurringUntil(recurringUntilDate)
    } else {
      // Explicitly set to empty string if not provided
      setRecurringUntil("")
    }
  }, [initialValues?.recurringUntil, initialValues?.id])

  // Update isRecurring state when initialValues.isRecurring changes
  useEffect(() => {
    setIsRecurring(initialValues?.isRecurring ?? false)
  }, [initialValues?.isRecurring])

  // Reset form state when switching to create mode
  useEffect(() => {
    if (!initialValues?.id) {
      // Create mode - reset state (location is handled by the above effect)
      setSelectedPropId(null)
      setSelectedInstructorId(null)
    }
  }, [initialValues?.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    // Add id if editing
    if (initialValues?.id) {
      formData.append("id", initialValues.id.toString())
    }

    // Add propId if selected
    if (selectedPropId !== null) {
      formData.append("propId", selectedPropId.toString())
    }

    // Add instructorId if selected
    if (selectedInstructorId !== null) {
      formData.append("instructorId", selectedInstructorId.toString())
    }

    // If user is instructor (not admin), always include their instructorId
    if (userProfile && userProfile.isInstructor && !userProfile.isAdmin) {
      formData.append("instructorId", userProfile.id.toString())
    }

    // Determine location value: use selected option or custom text
    const locationValue =
      selectedLocation === "Other" ? customLocation.trim() : selectedLocation
    formData.append("location", locationValue)

    // Add recurring fields - always send isRecurring value (true or false)
    formData.append("isRecurring", isRecurring ? "true" : "false")

    // Validate recurringUntil for instructors
    if (
      isRecurring &&
      userProfile &&
      userProfile.isInstructor &&
      !userProfile.isAdmin
    ) {
      if (!recurringUntil) {
        setRecurringValidationError(
          "Please specify an end date for recurring events",
        )
        return
      }
      // Validate that recurringUntil is after the start date
      if (date && recurringUntil && new Date(recurringUntil) < new Date(date)) {
        setRecurringValidationError("End date must be after the start date")
        return
      }
    }
    setRecurringValidationError(null)

    // Always add recurringUntil to formData (even if empty) so we can distinguish
    // between "not provided" and "cleared" in the server action
    // For instructors, if isRecurring is true, recurringUntil will be validated above
    if (isRecurring) {
      formData.append("recurringUntil", recurringUntil || "")
    }

    await onSubmit(formData)
  }

  async function handleDelete() {
    if (!onDelete || !initialValues?.id) return

    setIsDeleting(true)
    try {
      await onDelete(initialValues.id, cancellationMessage.trim() || null)
      setDeleteDialogOpen(false)
      setCancellationMessage("")
    } catch (err) {
      console.error("Failed to delete event:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleDeleteDialogOpenChange(newOpen: boolean) {
    setDeleteDialogOpen(newOpen)
    if (!newOpen) {
      // Reset cancellation message when dialog closes
      setCancellationMessage("")
    }
  }

  async function handleDeleteAllFuture() {
    if (!onDeleteAllFuture || !initialValues?.id) return

    setIsDeletingAllFuture(true)
    try {
      await onDeleteAllFuture(
        initialValues.id,
        cancellationMessage.trim() || null,
      )
      setDeleteAllFutureDialogOpen(false)
      setCancellationMessage("")
    } catch (err) {
      console.error("Failed to delete event and future events:", err)
    } finally {
      setIsDeletingAllFuture(false)
    }
  }

  function handleDeleteAllFutureDialogOpenChange(newOpen: boolean) {
    setDeleteAllFutureDialogOpen(newOpen)
    if (!newOpen) {
      // Reset cancellation message when dialog closes
      setCancellationMessage("")
    }
  }

  const isEditMode = !!initialValues?.id

  const formatCreatedAt = (value: string | Date) => {
    const d = typeof value === "string" ? new Date(value) : value
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Calculate number of recurring events
  function calculateRecurringEventCount(
    startDate: string,
    endDate: string,
  ): number {
    if (!startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) return 0

    let count = 0
    let currentDate = new Date(start)

    while (currentDate <= end) {
      count++
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + 7)
    }

    return count
  }

  // Calculate dates that will be created for recurring events
  function calculateRecurringEventDates(
    startDate: string,
    endDate: string,
    excludeFirst: boolean = false,
  ): string[] {
    if (!startDate || !endDate) return []

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) return []

    const dates: string[] = []
    let currentDate = new Date(start)
    let isFirst = true

    while (currentDate <= end) {
      if (!excludeFirst || !isFirst) {
        dates.push(currentDate.toISOString().split("T")[0])
      }
      isFirst = false
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + 7)
    }

    return dates
  }

  // Format date for display (e.g., "Mon, 14 Feb 2026")
  function formatEventDate(dateStr: string): string {
    const date = new Date(dateStr)
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()
    return `${weekday}, ${day} ${month} ${year}`
  }

  // Calculate event count: when editing, exclude the event being updated (it's updated, not created)
  const totalEventCount =
    isRecurring && date && recurringUntil
      ? calculateRecurringEventCount(date, recurringUntil)
      : 0
  // When editing, subtract 1 since the event at the new date is being updated, not created
  const eventCount =
    isEditMode && totalEventCount > 0 ? totalEventCount - 1 : totalEventCount

  // Calculate dates that will be created (exclude first date if editing)
  const eventDatesToCreate =
    isRecurring && date && recurringUntil
      ? calculateRecurringEventDates(date, recurringUntil, isEditMode)
      : []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditMode && initialValues?.createdAt && (
        <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Created: </span>
          {formatCreatedAt(initialValues.createdAt)}
          {initialValues?.lastUpdatedByUser?.username && (
            <>
              {" • "}
              <span className="font-medium text-foreground">
                Last Updated By:{" "}
              </span>
              <Link
                href={`/artists/${initialValues.lastUpdatedByUser.username}`}
                className="text-primary hover:underline"
              >
                {initialValues.lastUpdatedByUser.displayName ||
                  initialValues.lastUpdatedByUser.username}
              </Link>
            </>
          )}
          {initialValues?.approvedByUser?.username && (
            <>
              {" • "}
              <span className="font-medium text-foreground">Approved By: </span>
              <Link
                href={`/artists/${initialValues.approvedByUser.username}`}
                className="text-primary hover:underline"
              >
                {initialValues.approvedByUser.displayName ||
                  initialValues.approvedByUser.username}
              </Link>
            </>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            name="title"
            defaultValue={initialValues?.title || ""}
            required
            disabled={isSubmitting}
          />
        </div>
        {userProfile && userProfile.isInstructor && !userProfile.isAdmin ? (
          <div className="space-y-2">
            <Label htmlFor="instructorId">Instructor *</Label>
            <Input
              id="instructorId"
              name="instructorId"
              value={
                userProfile.displayName ||
                userProfile.username ||
                `User ${userProfile.id}`
              }
              disabled
              className="bg-muted"
            />
            <input type="hidden" name="instructorId" value={userProfile.id} />
          </div>
        ) : userProfile && userProfile.isAdmin ? (
          <div className="space-y-2">
            <Label htmlFor="instructorId">Instructor (User)</Label>
            <select
              id="instructorId"
              name="instructorId"
              value={selectedInstructorId || ""}
              onChange={(e) => {
                const value = e.target.value
                setSelectedInstructorId(
                  value === "" ? null : parseInt(value, 10),
                )
              }}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select an instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.displayName || instructor.username}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Select an instructor from registered users. Leave empty to use
              instructor name below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor *</Label>
            <Input
              id="instructor"
              name="instructor"
              defaultValue={initialValues?.instructor || ""}
              required
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>
      {userProfile && userProfile.isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="instructor">
            Instructor Name (if not registered)
          </Label>
          <Input
            id="instructor"
            name="instructor"
            defaultValue={initialValues?.instructor || ""}
            disabled={isSubmitting || selectedInstructorId !== null}
            placeholder={
              selectedInstructorId
                ? "Will use selected instructor's name"
                : "Enter instructor name if not registered"
            }
          />
          <p className="text-xs text-muted-foreground">
            Only fill this if the instructor hasn't signed up yet. If
            instructorId is selected above, this will be ignored.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description || ""}
          required
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time *</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={initialValues?.startTime || ""}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time *</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            defaultValue={initialValues?.endTime || ""}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <select
          id="location"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          required
          disabled={isSubmitting}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a location</option>
          <option value="Paradise Stage">Paradise Stage</option>
          <option value="Paradise River">Paradise River</option>
          <option value="Other">Other</option>
        </select>
        {selectedLocation === "Other" && (
          <Input
            id="customLocation"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Enter location"
            disabled={isSubmitting}
            className="mt-2"
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatToBring">What to Bring (Optional)</Label>
        <Textarea
          id="whatToBring"
          name="whatToBring"
          defaultValue={initialValues?.whatToBring || ""}
          placeholder="Enter items participants should bring, one per line (e.g., Yoga mat&#10;Towel)"
          disabled={isSubmitting}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Each line will be displayed as a separate item. Leave blank if no
          items are needed.
        </p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            id="isWorkshop"
            checked={isWorkshop}
            onChange={(e) => setIsWorkshop(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300"
          />
          <input
            type="hidden"
            name="isWorkshop"
            value={isWorkshop ? "on" : "off"}
          />
          <Label htmlFor="isWorkshop" className="cursor-pointer">
            Is Workshop
          </Label>
        </label>
      </div>

      {isWorkshop && (
        <div className="space-y-2">
          <Label htmlFor="level">
            Level (Beginner, Intermediate, Advanced)
          </Label>
          <select
            id="level"
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="All levels">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Beginner/Intermediate">Beginner/Intermediate</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Intermediate/Advanced">Intermediate/Advanced</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      )}

      {userProfile && userProfile.isAdmin && initialValues?.id && (
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              defaultChecked={initialValues?.isPublished ?? true}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPublished" className="cursor-pointer">
              Published
            </Label>
          </label>
          <p className="text-xs text-muted-foreground">
            Check this box to publish the event and make it visible to
            participants. Uncheck to unpublish.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="propId">Prop (Optional)</Label>
        <select
          id="propId"
          name="propId"
          value={selectedPropId || ""}
          onChange={(e) => {
            const value = e.target.value
            setSelectedPropId(value === "" ? null : parseInt(value, 10))
          }}
          disabled={isSubmitting}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">No prop selected</option>
          {availableProps.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Select a prop used in this event. Leave empty if no prop is needed.
        </p>
      </div>

      {(userProfile?.isAdmin || userProfile?.isInstructor) && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked)
                  if (!e.target.checked) {
                    setRecurringUntil("")
                    setRecurringValidationError(null)
                  }
                }}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                Recurring event (weekly)
              </Label>
            </label>
            <p className="text-xs text-muted-foreground">
              {userProfile.isAdmin ? (
                <>
                  Check this box to create this event weekly. Events will be
                  automatically extended weekly, creating 1 event 1 week ahead.
                </>
              ) : (
                <>
                  Check this box to create this event weekly. You must specify
                  an end date for recurring events.
                  <span className="block mt-1">
                    Your recurring events will be submitted for admin approval.
                  </span>
                </>
              )}
            </p>
            {isRecurring && (
              <div className="space-y-2 mt-3">
                {userProfile.isInstructor && !userProfile.isAdmin ? (
                  <>
                    <Label htmlFor="recurringUntil">
                      Recurring Until (End Date) *
                    </Label>
                    <Input
                      id="recurringUntil"
                      name="recurringUntil"
                      type="date"
                      value={recurringUntil}
                      onChange={(e) => {
                        setRecurringUntil(e.target.value)
                        setRecurringValidationError(null)
                      }}
                      min={date || undefined}
                      required
                      disabled={isSubmitting}
                      className={
                        recurringValidationError ? "border-destructive" : ""
                      }
                    />
                    {recurringUntil && eventCount > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          This will create {eventCount}{" "}
                          {isEditMode ? "additional " : ""}event
                          {eventCount !== 1 ? "s" : ""}.
                        </p>
                        {eventDatesToCreate.length > 0 && (
                          <ul className="list-disc list-inside ml-2 space-y-0.5">
                            {eventDatesToCreate.map((dateStr) => (
                              <li key={dateStr}>{formatEventDate(dateStr)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {recurringValidationError && (
                      <p className="text-xs text-destructive">
                        {recurringValidationError}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Label htmlFor="recurringUntil">
                      Recurring Until (End Date) (Optional)
                    </Label>
                    <Input
                      id="recurringUntil"
                      name="recurringUntil"
                      type="date"
                      value={recurringUntil}
                      onChange={(e) => setRecurringUntil(e.target.value)}
                      min={date || undefined}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optionally specify an end date. If left empty, events will
                      recur indefinitely.
                    </p>
                    {recurringUntil && eventCount > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          This will create {eventCount}{" "}
                          {isEditMode ? "additional " : ""}event
                          {eventCount !== 1 ? "s" : ""}.
                        </p>
                        {eventDatesToCreate.length > 0 && (
                          <ul className="list-disc list-inside ml-2 space-y-0.5">
                            {eventDatesToCreate.map((dateStr) => (
                              <li key={dateStr}>{formatEventDate(dateStr)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {onDelete && initialValues?.id ? (
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={handleDeleteDialogOpenChange}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting || isDeleting || isDeletingAllFuture}
                  className="w-full sm:w-auto"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Event
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "
                    {initialValues.title || "this event"}"? This will also
                    delete all associated participations and send cancellation
                    emails to all participants. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-4">
                  <Label htmlFor="cancellation-message-form">
                    Cancellation Message (Optional)
                  </Label>
                  <Textarea
                    id="cancellation-message-form"
                    placeholder="Add a message to inform participants about why this event was cancelled..."
                    value={cancellationMessage}
                    onChange={(e) => setCancellationMessage(e.target.value)}
                    disabled={isDeleting}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be included in the cancellation email sent
                    to all participants.
                  </p>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Event"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          {onDeleteAllFuture &&
          (userProfile?.isAdmin || userProfile?.isInstructor) &&
          initialValues?.id ? (
            <AlertDialog
              open={deleteAllFutureDialogOpen}
              onOpenChange={handleDeleteAllFutureDialogOpenChange}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting || isDeleting || isDeletingAllFuture}
                  className="w-full sm:w-auto"
                >
                  {isDeletingAllFuture ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete and All Future Events
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete Event and All Future Events
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "
                    {initialValues.title || "this event"}" and all future events
                    for this instructor? This will delete all events from this
                    date onwards for the same instructor and send cancellation
                    emails to all participants. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-4">
                  <Label htmlFor="cancellation-message-all-future-form">
                    Cancellation Message (Optional)
                  </Label>
                  <Textarea
                    id="cancellation-message-all-future-form"
                    placeholder="Add a message to inform participants about why these events were cancelled..."
                    value={cancellationMessage}
                    onChange={(e) => setCancellationMessage(e.target.value)}
                    disabled={isDeletingAllFuture}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be included in the cancellation email sent
                    to all participants for all affected events.
                  </p>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeletingAllFuture}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllFuture}
                    disabled={isDeletingAllFuture}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeletingAllFuture ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete All Future Events"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isDeleting || isDeletingAllFuture}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isDeleting || isDeletingAllFuture}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submittingText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
