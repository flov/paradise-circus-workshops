"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createProfile, getAllProps } from "@/app/profile/actions";
import { Loader2, Plus, X } from "lucide-react";
import { validateInstagramHandle } from "@/lib/utils";
import type { ProfileFormData, PropOption } from "@/lib/types";

interface Prop {
  propName: string;
  skillLevel: number;
}

interface ProfileFormProps {
  initialData?: ProfileFormData & { props?: Prop[] };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState(initialData?.username || "");
  const [displayName, setDisplayName] = useState(initialData?.displayName || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [instagramHandle, setInstagramHandle] = useState(
    initialData?.instagramHandle || "",
  );
  const [isInstructor, setIsInstructor] = useState(
    initialData?.isInstructor || false,
  );
  const [experienceStartDate, setExperienceStartDate] = useState(
    initialData?.experienceStartDate
      ? typeof initialData.experienceStartDate === "string"
        ? initialData.experienceStartDate
        : new Date(initialData.experienceStartDate).toISOString().split("T")[0]
      : "",
  );
  const [performanceStyle, setPerformanceStyle] = useState(
    initialData?.performanceStyle || "",
  );
  const [availableForPerformances, setAvailableForPerformances] = useState(
    initialData?.availableForPerformances || false,
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [youtubeVideos, setYoutubeVideos] = useState(
    Array.isArray(initialData?.youtubeVideos)
      ? initialData.youtubeVideos.join(", ")
      : initialData?.youtubeVideos || "",
  );
  const [props, setProps] = useState<Prop[]>(initialData?.props || []);
  const [availableProps, setAvailableProps] = useState<PropOption[]>([]);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  // Fetch available props for autocomplete
  useEffect(() => {
    async function fetchProps() {
      try {
        const propsList = await getAllProps();
        setAvailableProps(propsList);
      } catch (error: unknown) {
        console.error("Failed to fetch props:", error);
      }
    }
    fetchProps();
  }, []);

  // Memoize filtered props to avoid unnecessary recalculations
  const filteredProps = useMemo(
    () => props.filter((p) => p.propName.trim()),
    [props],
  );

  const addProp = useCallback(() => {
    setProps((prev) => [...prev, { propName: "", skillLevel: 5 }]);
  }, []);

  const removeProp = useCallback((index: number) => {
    setProps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateProp = useCallback(
    (index: number, field: keyof Prop, value: string | number) => {
      setProps((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  // Validate Instagram handle on change
  const handleInstagramChange = useCallback((value: string) => {
    setInstagramHandle(value);
    if (value.trim()) {
      const validation = validateInstagramHandle(value);
      setInstagramError(validation.isValid ? null : validation.error || null);
    } else {
      setInstagramError(null);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate Instagram handle before submission
    if (instagramHandle.trim()) {
      const instagramValidation = validateInstagramHandle(instagramHandle);
      if (!instagramValidation.isValid) {
        setError(instagramValidation.error || "Invalid Instagram handle");
        setIsSubmitting(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("displayName", displayName.trim());
    formData.append("bio", bio.trim());
    formData.append("instagramHandle", instagramHandle.trim());
    formData.append("isInstructor", isInstructor.toString());
    formData.append("experienceStartDate", experienceStartDate);
    formData.append("performanceStyle", performanceStyle.trim());
    formData.append(
      "availableForPerformances",
      availableForPerformances.toString(),
    );
    formData.append("location", location.trim());
    formData.append("youtubeVideos", youtubeVideos.trim());
    formData.append("props", JSON.stringify(filteredProps));

    try {
      const result = await createProfile(formData);

      if (result.success && result.username) {
        router.push(`/artist/${result.username}`);
        router.refresh();
      } else {
        setError(result.error || "Failed to save profile");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Profile save error:", err);
      setError(
        errorMessage || "An unexpected error occurred. Please try again.",
      );
      setIsSubmitting(false);
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
              aria-describedby="username-help"
            />
            <p id="username-help" className="text-xs text-muted-foreground">
              3-30 characters, letters, numbers, dots, hyphens, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">What would you like to be called?</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name (e.g., John, Alex, etc.)"
              aria-describedby="displayName-help"
            />
            <p id="displayName-help" className="text-xs text-muted-foreground">
              This is how others will see your name on the platform
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
              aria-describedby="bio-help"
            />
            <p id="bio-help" className="text-xs text-muted-foreground">
              Tell us about your circus and flow arts journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagramHandle">Instagram Handle</Label>
              <Input
                id="instagramHandle"
                value={instagramHandle}
                onChange={(e) => handleInstagramChange(e.target.value)}
                placeholder="@username"
                aria-describedby="instagram-help"
                aria-invalid={instagramError ? "true" : "false"}
                className={instagramError ? "border-destructive" : ""}
              />
              {instagramError && (
                <p className="text-sm text-destructive" role="alert">
                  {instagramError}
                </p>
              )}
              <p id="instagram-help" className="text-xs text-muted-foreground">
                Your Instagram username (with or without @)
              </p>
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
              <Label htmlFor="experienceStartDate">Experience Start Date</Label>
              <Input
                id="experienceStartDate"
                type="date"
                value={experienceStartDate}
                onChange={(e) => setExperienceStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                When did you start playing? Years of experience will be
                calculated automatically.
              </p>
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
              <Label
                htmlFor="availableForPerformances"
                className="cursor-pointer"
              >
                Available for Performances
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Props & Skills</Label>
            <div className="space-y-3">
              {props.map((prop, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Prop name (e.g., Hoop, Staff)"
                      value={prop.propName}
                      onChange={(e) =>
                        updateProp(index, "propName", e.target.value)
                      }
                      list={`prop-list-${index}`}
                      className="w-full"
                    />
                    <datalist id={`prop-list-${index}`}>
                      {availableProps.map((availableProp) => (
                        <option
                          key={availableProp.id}
                          value={availableProp.name}
                        />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={prop.skillLevel}
                      onChange={(e) =>
                        updateProp(
                          index,
                          "skillLevel",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1"
                      aria-label={`Skill level for ${prop.propName || "prop"}`}
                      aria-valuemin={0}
                      aria-valuemax={10}
                      aria-valuenow={prop.skillLevel}
                      aria-valuetext={`Level ${prop.skillLevel} out of 10`}
                    />
                    <span className="text-sm w-8 text-right" aria-live="polite">
                      {prop.skillLevel}
                    </span>
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
              aria-describedby="youtube-help"
            />
            <p id="youtube-help" className="text-xs text-muted-foreground">
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
              ) : initialData && 'id' in initialData ? (
                "Update Profile"
              ) : (
                "Complete Setup"
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
  );
}
