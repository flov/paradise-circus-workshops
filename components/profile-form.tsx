"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { createProfile } from "@/app/profile/actions"
import { Loader2, Plus, X } from "lucide-react"

interface Prop {
  propName: string
  skillLevel: number
}

export function ProfileForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [username, setUsername] = useState(initialData?.username || "")
  const [bio, setBio] = useState(initialData?.bio || "")
  const [instagramHandle, setInstagramHandle] = useState(initialData?.instagramHandle || "")
  const [isInstructor, setIsInstructor] = useState(initialData?.isInstructor || false)
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData?.yearsOfExperience?.toString() || "")
  const [performanceStyle, setPerformanceStyle] = useState(initialData?.performanceStyle || "")
  const [availableForPerformances, setAvailableForPerformances] = useState(initialData?.availableForPerformances || false)
  const [location, setLocation] = useState(initialData?.location || "")
  const [youtubeVideos, setYoutubeVideos] = useState(
    initialData?.youtubeVideos?.join(", ") || ""
  )
  const [props, setProps] = useState<Prop[]>(initialData?.props || [])

  function addProp() {
    setProps([...props, { propName: "", skillLevel: 5 }])
  }

  function removeProp(index: number) {
    setProps(props.filter((_, i) => i !== index))
  }

  function updateProp(index: number, field: keyof Prop, value: string | number) {
    const updated = [...props]
    updated[index] = { ...updated[index], [field]: value }
    setProps(updated)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("username", username)
    formData.append("bio", bio)
    formData.append("instagramHandle", instagramHandle)
    formData.append("isInstructor", isInstructor.toString())
    formData.append("yearsOfExperience", yearsOfExperience)
    formData.append("performanceStyle", performanceStyle)
    formData.append("availableForPerformances", availableForPerformances.toString())
    formData.append("location", location)
    formData.append("youtubeVideos", youtubeVideos)
    formData.append("props", JSON.stringify(props.filter(p => p.propName.trim())))

    try {
      const result = await createProfile(formData)

      if (result.success && result.username) {
        router.push(`/artist/${result.username}`)
        router.refresh()
      } else {
        setError(result.error || "Failed to save profile")
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("Profile save error:", err)
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="your-username"
        />
        <p className="text-xs text-muted-foreground">
          3-30 characters, letters, numbers, hyphens, and underscores only
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagramHandle">Instagram Handle</Label>
          <Input
            id="instagramHandle"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="@username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Years of Experience</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            min="0"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            placeholder="5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="performanceStyle">Performance Style</Label>
          <Input
            id="performanceStyle"
            value={performanceStyle}
            onChange={(e) => setPerformanceStyle(e.target.value)}
            placeholder="e.g., fire, LED, day"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isInstructor"
            checked={isInstructor}
            onChange={(e) => setIsInstructor(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isInstructor" className="cursor-pointer">
            I&apos;m an instructor at paradise
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="availableForPerformances"
            checked={availableForPerformances}
            onChange={(e) => setAvailableForPerformances(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="availableForPerformances" className="cursor-pointer">
            Available for Performances
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Props & Skills</Label>
        <div className="space-y-3">
          {props.map((prop, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Prop name (e.g., Hoop, Staff)"
                value={prop.propName}
                onChange={(e) => updateProp(index, "propName", e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2 w-32">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={prop.skillLevel}
                  onChange={(e) => updateProp(index, "skillLevel", parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-8 text-right">{prop.skillLevel}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProp(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addProp}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prop
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtubeVideos">YouTube Videos</Label>
        <Textarea
          id="youtubeVideos"
          value={youtubeVideos}
          onChange={(e) => setYoutubeVideos(e.target.value)}
          placeholder="Enter YouTube URLs or video IDs, separated by commas"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Paste YouTube URLs or video IDs separated by commas
        </p>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? "Update Profile" : "Create Profile"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
        </form>
      </CardContent>
    </Card>
  )
}
