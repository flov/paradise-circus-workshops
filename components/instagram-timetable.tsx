"use client";

import React from "react";

interface ScheduleEvent {
  name: string;
  instructor: string;
  isLogo?: boolean;
  isSpecial?: boolean;
  span?: number; // Number of time slots this event spans
  isOccupied?: boolean; // True if this slot is occupied by a multi-slot event
}

interface ScheduleData {
  title: string;
  days: string[];
  timeSlots: string[];
  events: Record<string, ScheduleEvent | null>;
}

interface InstagramTimetableProps {
  data: ScheduleData;
  aspectRatio?: "square" | "portrait" | "landscape";
  location?: string;
}

export function InstagramTimetable({
  data,
  aspectRatio = "landscape",
  location = "paradise-stage",
}: InstagramTimetableProps) {
  const aspectClasses = {
    square: "aspect-square max-w-[1080px]",
    portrait: "aspect-[4/5] max-w-[864px]",
    landscape: "aspect-[4/3] max-w-[1200px]",
  };

  return (
    <div
      className={`relative w-full ${aspectClasses[aspectRatio]} overflow-hidden`}
      style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
    >
      {/* Sunburst Background */}
      <div className="absolute inset-0">
        <SunburstBackground location={location} />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-2 sm:p-3">
        {/* Title */}
        <h1
          className="text-center font-normal text-white text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-wide mb-2 sm:mb-3"
          style={{
            textShadow:
              "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
            fontFamily: "var(--font-rye), 'Rye', serif",
          }}
        >
          {data.title}
        </h1>

        {/* Timetable Grid */}
        <div className="flex-1 min-h-0">
          <div
            className="grid h-full gap-[2px] sm:gap-1"
            style={{
              gridTemplateColumns: `auto repeat(${data.days.length}, 1fr)`,
              gridTemplateRows: `auto repeat(${data.timeSlots.length}, 1fr)`,
            }}
          >
            {/* Header Row */}
            <HeaderCell>TIME</HeaderCell>
            {data.days.map((day) => (
              <HeaderCell key={day}>{day}</HeaderCell>
            ))}

            {/* Time Rows */}
            {data.timeSlots.map((time, timeIndex) => (
              <React.Fragment key={time}>
                <TimeCell>{time}</TimeCell>
                {data.days.map((day) => {
                  const event = data.events[`${time}-${day}`];

                  // Check if this cell is occupied by a spanning event starting in an earlier time slot
                  let isOccupiedByEarlier = false;
                  for (let i = 0; i < timeIndex; i++) {
                    const earlierTime = data.timeSlots[i];
                    const earlierEvent = data.events[`${earlierTime}-${day}`];
                    if (earlierEvent?.span && earlierEvent.span > 1) {
                      const spanEndIndex = i + earlierEvent.span - 1;
                      // This cell is occupied if it's within the span range (but not the start)
                      if (timeIndex <= spanEndIndex && timeIndex > i) {
                        isOccupiedByEarlier = true;
                        break;
                      }
                    }
                  }

                  // Don't render anything for occupied cells - CSS Grid handles spanning
                  if (isOccupiedByEarlier) {
                    return null;
                  }

                  // Get the row span for this event (default to 1 if not specified)
                  const rowSpan =
                    event?.span && event.span > 1 ? event.span : 1;

                  return (
                    <EventCell
                      key={`${time}-${day}`}
                      event={event}
                      rowSpan={rowSpan}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SunburstBackground({ location = "paradise-stage" }: { location?: string }) {
  const rays = 24;
  const rayElements = [];
  const stripeColor = location === "paradise-river" ? "#16a34a" : "#dc2626"; // green-600 for river, red-600 for stage

  for (let i = 0; i < rays; i++) {
    const rotation = (360 / rays) * i;
    rayElements.push(
      <div
        key={i}
        className="absolute origin-center"
        style={{
          top: "50%",
          left: "50%",
          width: "200%",
          height: "200%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          background:
            i % 2 === 0
              ? `linear-gradient(to right, ${stripeColor} 0%, ${stripeColor} 50%, transparent 50%)`
              : "linear-gradient(to right, #1a1a1a 0%, #1a1a1a 50%, transparent 50%)",
          clipPath: `polygon(50% 50%, 40% 0%, 55% 0%)`,
        }}
      />,
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden`} style={{ backgroundColor: stripeColor }}>
      {rayElements}
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center px-1 py-0.5 sm:px-2 sm:py-1">
      <span
        className="text-white font-black text-[10px] sm:text-sm md:text-base lg:text-lg tracking-wide text-center"
        style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
      >
        {children}
      </span>
    </div>
  );
}

function TimeCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center px-1 py-0.5 sm:px-2 sm:py-1">
      <span
        className="text-white font-black text-[8px] sm:text-xs md:text-sm lg:text-base tracking-wide"
        style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
      >
        {children}
      </span>
    </div>
  );
}

function EventCell({
  event,
  rowSpan = 1,
}: {
  event: ScheduleEvent | null;
  rowSpan?: number;
}) {
  if (!event) {
    return <div className="rounded-md sm:rounded-lg" />;
  }

  // Apply grid-row-span style if this event spans multiple rows
  const gridRowStyle =
    rowSpan > 1
      ? {
          gridRow: `span ${rowSpan}`,
        }
      : {};

  if (event.isLogo) {
    return (
      <div
        className="bg-black rounded-md sm:rounded-lg flex items-center justify-center p-1"
        style={gridRowStyle}
      >
        <div className="text-white text-center">
          <div className="text-[6px] sm:text-[8px] italic">The</div>
          <div className="text-[8px] sm:text-xs font-black border border-white px-1">
            PARADISE
          </div>
          <div className="text-[8px] sm:text-xs font-black">CIRCUS</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center p-0.5 sm:p-1 overflow-hidden"
      style={{ ...gridRowStyle, opacity: 0.85 }}
    >
      <div className="text-center w-full">
        <p
          className="text-white font-bold text-[6px] sm:text-[9px] md:text-[10px] lg:text-xs leading-tight line-clamp-2"
          style={{
            fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
          }}
        >
          {event.name}
        </p>
        {event.instructor && (
          <p
            className="text-white font-bold text-[5px] sm:text-[7px] md:text-[8px] lg:text-[10px] leading-tight opacity-90"
            style={{ fontFamily: "'Arial', sans-serif" }}
          >
            {event.instructor}
          </p>
        )}
      </div>
    </div>
  );
}
