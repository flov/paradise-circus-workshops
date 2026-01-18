"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { getAllProps, getCurrentUserProfile, getAllInstructors } from "@/app/profile/actions"

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
  isPublished?: boolean
  propId?: number | null
  isRecurring?: boolean
  recurUntil?: string
}

type EventFormProps = {
  initialValues?: EventFormInitialValues
  isSubmitting: boolean
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  error: string | null
  submitButtonText?: string
  submittingText?: string
}

export function EventForm({
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
  error,
  submitButtonText = "Save Event",
  submittingText = "Saving...",
}: EventFormProps) {
  const [availableProps, setAvailableProps] = useState<Array<{ id: number; name: string }>>([])
  const [selectedPropId, setSelectedPropId] = useState<number | null>(null)
  const [userProfile, setUserProfile] = useState<{ id: number; displayName: string | null; username: string; isAdmin: boolean; isInstructor: boolean } | null>(null)
  const [instructors, setInstructors] = useState<Array<{ id: number; displayName: string | null; username: string }>>([])
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)
  const [isRecurring, setIsRecurring] = useState<boolean>(initialValues?.isRecurring ?? false)
  const [recurUntil, setRecurUntil] = useState<string>(initialValues?.recurUntil || "")
  
  // Initialize date state
  const getInitialDate = (): string => {
    if (initialValues?.date) {
      return typeof initialValues.date === "string" && initialValues.date.includes("T")
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
  const [selectedLocation, setSelectedLocation] = useState<string>(getInitialSelectedLocation())
  const [customLocation, setCustomLocation] = useState(
    initialValues?.location && initialValues.location !== "Paradise Stage" && initialValues.location !== "Paradise River"
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
          if (profile.isInstructor && !profile.isAdmin && !initialValues?.instructorId) {
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

    // Add recurring fields if recurring is enabled
    // Note: Server-side validation will ensure only admins can create recurring events
    if (isRecurring) {
      formData.append("isRecurring", "true")
      if (recurUntil) {
        formData.append("recurUntil", recurUntil)
      }
    }

    await onSubmit(formData)
  }

  const isEditMode = !!initialValues?.id
  const formattedDate = date

  // Calculate number of events that will be created
  const calculateEventCount = (): number => {
    if (!isRecurring || !recurUntil || !formattedDate) return 0
    
    const startDate = new Date(formattedDate)
    const endDate = new Date(recurUntil)
    
    if (endDate < startDate) return 0
    
    let count = 0
    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      count++
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + 7)
    }
    
    return count
  }

  const eventCount = calculateEventCount()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              value={userProfile.displayName || userProfile.username || `User ${userProfile.id}`}
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
                setSelectedInstructorId(value === "" ? null : parseInt(value, 10))
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
              Select an instructor from registered users. Leave empty to use instructor name below.
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
          <Label htmlFor="instructor">Instructor Name (if not registered)</Label>
          <Input
            id="instructor"
            name="instructor"
            defaultValue={initialValues?.instructor || ""}
            disabled={isSubmitting || selectedInstructorId !== null}
            placeholder={selectedInstructorId ? "Will use selected instructor's name" : "Enter instructor name if not registered"}
          />
          <p className="text-xs text-muted-foreground">
            Only fill this if the instructor hasn't signed up yet. If instructorId is selected above, this will be ignored.
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
          Each line will be displayed as a separate item. Leave blank if no items are needed.
        </p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            id="isWorkshop"
            name="isWorkshop"
            defaultChecked={initialValues?.isWorkshop ?? true}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isWorkshop" className="cursor-pointer">Is Workshop</Label>
        </label>
        <p className="text-xs text-muted-foreground">
          Check this box if this event is a workshop. Uncheck for other event types.
        </p>
      </div>

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
            <Label htmlFor="isPublished" className="cursor-pointer">Published</Label>
          </label>
          <p className="text-xs text-muted-foreground">
            Check this box to publish the event and make it visible to participants. Uncheck to unpublish.
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

      {userProfile && userProfile.isAdmin && (
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
                    setRecurUntil("")
                  }
                }}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">Recurring Workshop</Label>
            </label>
            <p className="text-xs text-muted-foreground">
              Check this box to create this workshop weekly until the end date. Only admins can create recurring workshops.
            </p>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurUntil">Recur Until *</Label>
              <Input
                id="recurUntil"
                name="recurUntil"
                type="date"
                value={recurUntil}
                onChange={(e) => setRecurUntil(e.target.value)}
                required={isRecurring}
                disabled={isSubmitting}
                min={formattedDate || undefined}
              />
              {recurUntil && formattedDate && new Date(recurUntil) < new Date(formattedDate) && (
                <p className="text-xs text-destructive">
                  End date must be after the start date.
                </p>
              )}
              {eventCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  This will create {eventCount} event{eventCount !== 1 ? "s" : ""} weekly from {formattedDate} until {recurUntil}.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
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
    </form>
  )
}
