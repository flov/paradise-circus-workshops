"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { getWeekDates, formatLocalDate, organizeEvents } from "@/lib/timetable-utils"
import type { AuthContext } from "@/lib/timetable-utils"

const phrases = [
  "All levels are welcome",
  "Come curious, leave inspired",
  "Dance with fire, dance with friends",
  "Elevate your artistry",
  "Every prop tells a story",
  "Flow is a conversation with gravity",
  "Join the circus of your dreams",
  "Spin, breathe, connect",
  "The stage awaits — come as you are",
  "Unleash your inner performer",
  "Where ordinary becomes extraordinary",
  "Where passion meets performance",
]

export function HeroSection() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * phrases.length),
  )
  const [fading, setFading] = useState(false)

  // Prefetch this week's timetable so navigation to /timetable is instant
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  useEffect(() => {
    const dates = getWeekDates(0)
    const startDate = formatLocalDate(dates[0])
    const endDate = formatLocalDate(dates[6])

    const fetchTimetable = (userId: number | null) => {
      const apiUrl = userId
        ? `/api/timetable?start=${startDate}&end=${endDate}&userId=${userId}`
        : `/api/timetable/public?start=${startDate}&end=${endDate}`
      return queryClient.prefetchQuery({
        queryKey: ["timetable", 0, userId],
        queryFn: async () => {
          const res = await fetch(apiUrl)
          const events = await res.json()
          return organizeEvents(events)
        },
        staleTime: 60_000,
      })
    }

    if (isSignedIn) {
      // Prefetch auth-context first, then timetable with userId
      queryClient.prefetchQuery<AuthContext>({
        queryKey: ["auth-context", true],
        queryFn: async () => {
          const res = await fetch("/api/auth/me")
          const data = await res.json()
          return {
            isAdmin: data.isAdmin ?? false,
            isInstructor: data.isInstructor ?? false,
            userId: data.userId ?? null,
          }
        },
        staleTime: 5 * 60_000,
      }).then(() => {
        const cached = queryClient.getQueryData<AuthContext>(["auth-context", true])
        fetchTimetable(cached?.userId ?? null)
      })
    } else {
      fetchTimetable(null)
    }
  }, [queryClient, isSignedIn])

  const rotatePhrase = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % phrases.length)
      setFading(false)
    }, 400)
  }, [])

  useEffect(() => {
    const interval = setInterval(rotatePhrase, 4000)
    return () => clearInterval(interval)
  }, [rotatePhrase])

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/firespitter.jpg"
          alt="Fire breather performing at Paradise Circus"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span
            className={`text-sm font-medium transition-opacity duration-400 ${fading ? "opacity-0" : "opacity-100"}`}
          >
            {phrases[index]}
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-6 text-balance"
          style={{ fontFamily: "var(--font-rye)" }}
        >
          <span className="">The Paradise Circus</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
          A circus community in Pai, Thailand where passionate artists teach,
          learn, and create together. Poi, juggling, acrobatics, theater, magic
          — the possibilities are endless.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="text-base px-8 py-6 rounded-full"
          >
            <Link href="/timetable">
              View This Week&apos;s Workshops
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base px-8 py-6 rounded-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/artists">Meet the Artists</Link>
          </Button>
        </div>

        {/* Location badge */}
        <div className="mt-12 flex items-center justify-center gap-2 text-white/80">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm">Pai, Thailand</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  )
}
