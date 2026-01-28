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

// Single color scheme for all events
const getEventColor = (event: ScheduleEvent | null): string => {
  if (!event) return "from-slate-700 to-slate-800"; // FREE FLOW

  if (event.isSpecial) {
    return "from-orange-600 to-red-600"; // Special events
  }

  // Single consistent color for all regular events - dark blue-indigo gradient
  return "from-indigo-700 to-indigo-900";
};

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

  // Pre-calculate spans and occupied status for all cells
  const cellData: Record<string, { span: number; shouldRender: boolean }> = {};

  data.days.forEach((day) => {
    data.timeSlots.forEach((time, timeIndex) => {
      const key = `${time}-${day}`;
      const event = data.events[key];

      // Helper to check if a slot is occupied by an earlier event span
      const isOccupiedByEventSpan = (slotIndex: number): boolean => {
        for (let i = 0; i < slotIndex; i++) {
          const earlierTime = data.timeSlots[i];
          const earlierEvent = data.events[`${earlierTime}-${day}`];
          if (earlierEvent?.span && earlierEvent.span > 1) {
            const spanEndIndex = i + earlierEvent.span - 1;
            if (slotIndex <= spanEndIndex && slotIndex > i) {
              return true;
            }
          }
        }
        return false;
      };

      const isOccupiedByEarlier = isOccupiedByEventSpan(timeIndex);

      let span = 1;
      let shouldRender = true;

      if (event) {
        // Event with explicit span
        if (event.span && event.span > 1) {
          span = event.span;
        }
        // If occupied by earlier event span, don't render
        if (isOccupiedByEarlier) {
          shouldRender = false;
        }
      } else {
        // FREE FLOW slot
        if (isOccupiedByEarlier) {
          shouldRender = false;
        } else {
          // Check if this is part of an earlier FREE FLOW group
          for (let i = 0; i < timeIndex; i++) {
            const earlierTime = data.timeSlots[i];
            const earlierEvent = data.events[`${earlierTime}-${day}`];

            if (!earlierEvent && !isOccupiedByEventSpan(i)) {
              // Count consecutive FREE FLOW slots from this earlier slot
              let freeFlowSpan = 1;
              for (let j = i + 1; j < data.timeSlots.length; j++) {
                const checkTime = data.timeSlots[j];
                const checkEvent = data.events[`${checkTime}-${day}`];
                if (checkEvent || isOccupiedByEventSpan(j)) {
                  break;
                }
                freeFlowSpan++;
              }
              // If this slot is within the span
              if (timeIndex < i + freeFlowSpan && timeIndex > i) {
                shouldRender = false;
                break;
              }
            }
          }

          // If we should render, calculate span
          if (shouldRender) {
            for (let i = timeIndex + 1; i < data.timeSlots.length; i++) {
              const nextTime = data.timeSlots[i];
              const nextEvent = data.events[`${nextTime}-${day}`];
              if (nextEvent || isOccupiedByEventSpan(i)) {
                break;
              }
              span++;
            }
          }
        }
      }

      cellData[key] = { span, shouldRender };
    });
  });

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
          className="text-center font-normal text-white text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-wide mb-2 sm:mb-3 drop-shadow-2xl"
          style={{
            textShadow:
              "4px 4px 0 rgba(0,0,0,0.8), -2px -2px 0 rgba(0,0,0,0.8), 2px -2px 0 rgba(0,0,0,0.8), -2px 2px 0 rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
            fontFamily: "var(--font-rye), 'Rye', serif",
          }}
        >
          {data.title}
        </h1>

        {/* Timetable Grid */}
        <div className="flex-1 min-h-0">
          <div
            className="grid h-full gap-1 sm:gap-1.5 md:gap-2"
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
                {data.days.map((day, dayIndex) => {
                  const key = `${time}-${day}`;
                  const event = data.events[key];
                  const { span, shouldRender } = cellData[key];

                  if (!shouldRender) {
                    return null;
                  }

                  return <EventCell key={key} event={event} rowSpan={span} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SunburstBackground({
  location = "paradise-stage",
}: {
  location?: string;
}) {
  const rays = 24;
  const rayElements = [];
  const stripeColor = location === "paradise-river" ? "#16a34a" : "#dc2626"; // green-600 for river, red-600 for stage
  const baseColor = location === "paradise-river" ? "#15803d" : "#b91c1c"; // darker shade for base

  for (let i = 0; i < rays; i++) {
    const rotation = (360 / rays) * i;
    rayElements.push(
      <div
        key={i}
        className="absolute origin-center opacity-80"
        style={{
          top: "50%",
          left: "50%",
          width: "200%",
          height: "200%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          background:
            i % 2 === 0
              ? `linear-gradient(to right, ${stripeColor} 0%, ${stripeColor} 50%, transparent 50%)`
              : `linear-gradient(to right, ${baseColor} 0%, ${baseColor} 50%, transparent 50%)`,
          clipPath: `polygon(50% 50%, 40% 0%, 55% 0%)`,
        }}
      />,
    );
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden`}
      style={{
        backgroundColor: stripeColor,
        backgroundImage: `radial-gradient(circle at center, ${stripeColor} 0%, ${baseColor} 100%)`,
      }}
    >
      {rayElements}
      {/* Add a subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center px-1 py-0.5 sm:px-2 sm:py-1 shadow-lg border border-gray-600/50 backdrop-blur-sm">
      <span
        className="text-white font-black text-[10px] sm:text-sm md:text-base lg:text-lg tracking-wide text-center drop-shadow-lg"
        style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
      >
        {children}
      </span>
    </div>
  );
}

function TimeCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center px-1 py-0.5 sm:px-2 sm:py-1 shadow-md border border-gray-600/40 backdrop-blur-sm">
      <span
        className="text-white font-black text-[8px] sm:text-xs md:text-sm lg:text-base tracking-wide drop-shadow-md"
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
  // Apply grid-row-span style if this event spans multiple rows
  const gridRowStyle =
    rowSpan > 1
      ? {
          gridRow: `span ${rowSpan}`,
        }
      : {};

  const colorClass = getEventColor(event);
  const eventNameUpper = event?.name?.toUpperCase() || "";
  const isSpecial = eventNameUpper.includes("FIRESHOW");

  if (!event) {
    return (
      <div
        className={`bg-gradient-to-br ${colorClass} rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 sm:p-1 overflow-hidden shadow-md border border-gray-600/30 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
        style={gridRowStyle}
      >
        <div className="text-center w-full">
          <p
            className="text-white/90 font-bold text-[10px] sm:text-[13px] md:text-[14px] lg:text-base leading-tight drop-shadow-md"
            style={{
              fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
            }}
          >
            FREE FLOW
          </p>
        </div>
      </div>
    );
  }

  if (event.isLogo) {
    return (
      <div
        className="bg-gradient-to-br from-black via-gray-900 to-black rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-xl border-2 border-white/20 backdrop-blur-sm"
        style={gridRowStyle}
      >
        <div className="text-white text-center">
          <div className="text-[6px] sm:text-[8px] italic opacity-80">The</div>
          <div className="text-[8px] sm:text-xs font-black border-2 border-white px-1 py-0.5 shadow-lg">
            PARADISE
          </div>
          <div className="text-[8px] sm:text-xs font-black drop-shadow-lg">
            CIRCUS
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${colorClass} rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 sm:p-1 overflow-hidden shadow-lg border-2 ${
        isSpecial
          ? "border-orange-400/60 shadow-orange-500/30"
          : "border-white/20"
      } backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:brightness-110`}
      style={gridRowStyle}
    >
      <div className="text-center w-full px-0.5">
        <p
          className={`text-white font-black text-[10px] sm:text-[13px] md:text-[14px] lg:text-base leading-tight line-clamp-2 drop-shadow-lg ${
            isSpecial ? "text-yellow-100" : ""
          }`}
          style={{
            fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
          }}
        >
          {event.name}
        </p>
        {event.instructor && (
          <p
            className={`text-white font-semibold text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight mt-0.5 drop-shadow-md ${
              isSpecial ? "text-yellow-50 opacity-95" : "opacity-90"
            }`}
            style={{ fontFamily: "'Arial', sans-serif" }}
          >
            {event.instructor}
          </p>
        )}
      </div>
    </div>
  );
}
