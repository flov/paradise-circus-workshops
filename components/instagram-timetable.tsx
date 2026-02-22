"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { createEventSlug } from "@/lib/utils";

interface ScheduleEvent {
  name: string;
  instructor: string;
  eventId?: number;
  instructorUsername?: string;
  isLogo?: boolean;
  isSpecial?: boolean;
  span?: number; // Number of time slots this event spans
  isOccupied?: boolean; // True if this slot is occupied by a multi-slot event
  startsAtHalfHour?: boolean; // True if event starts at :30 (e.g., 12:30)
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
  stripeColor?: string;
}

export function InstagramTimetable({
  data,
  aspectRatio = "landscape",
  location = "paradise-stage",
  stripeColor: initialStripeColor,
}: InstagramTimetableProps) {
  // Default colors based on location
  const defaultStripeColor = useMemo(() => {
    if (initialStripeColor) return initialStripeColor;
    return location === "paradise-river" ? "#16a34a" : "#dc2626"; // green-600 for river, red-600 for stage
  }, [location, initialStripeColor]);

  const [stripeColor, setStripeColor] = useState(defaultStripeColor);
  const [secondStripeColor, setSecondStripeColor] = useState("#ffffff"); // Default to white

  // Update stripe color when location changes
  useEffect(() => {
    if (!initialStripeColor) {
      setStripeColor(location === "paradise-river" ? "#16a34a" : "#dc2626");
    }
  }, [location, initialStripeColor]);

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
    <div className="w-full flex flex-col items-center gap-4">
      {/* Color Pickers */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="stripe-color"
            className="text-white text-sm font-medium"
          >
            Stripe Color:
          </label>
          <input
            id="stripe-color"
            type="color"
            value={stripeColor}
            onChange={(e) => setStripeColor(e.target.value)}
            className="w-16 h-10 rounded cursor-pointer border-2 border-gray-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="second-stripe-color"
            className="text-white text-sm font-medium"
          >
            Second Stripe Color:
          </label>
          <input
            id="second-stripe-color"
            type="color"
            value={secondStripeColor}
            onChange={(e) => setSecondStripeColor(e.target.value)}
            className="w-16 h-10 rounded cursor-pointer border-2 border-gray-400"
          />
        </div>
      </div>

      <div
        className={`relative w-full ${aspectClasses[aspectRatio]} overflow-hidden`}
        style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
      >
        {/* Sunburst Background */}
        <div className="absolute inset-0">
          <SunburstBackground
            location={location}
            stripeColor={stripeColor}
            secondStripeColor={secondStripeColor}
          />
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
              <HeaderCell style={{ gridRow: 1, gridColumn: 1 }}>
                TIME
              </HeaderCell>
              {data.days.map((day, dayIndex) => (
                <HeaderCell
                  key={day}
                  style={{ gridRow: 1, gridColumn: dayIndex + 2 }}
                >
                  {day}
                </HeaderCell>
              ))}

              {/* Time Rows */}
              {data.timeSlots.map((time, timeIndex) => {
                // Calculate the grid row (1-indexed, +1 for header row)
                const gridRow = timeIndex + 2;

                return (
                  <React.Fragment key={time}>
                    <TimeCell style={{ gridRow, gridColumn: 1 }}>
                      {time}
                    </TimeCell>
                    {data.days.map((day, dayIndex) => {
                      const key = `${time}-${day}`;
                      const event = data.events[key];
                      const cellInfo = cellData[key];

                      // Calculate grid column (1-indexed, +1 for time column)
                      const gridColumn = dayIndex + 2;

                      // Ensure cellData exists - if not, calculate defaults
                      if (!cellInfo) {
                        return (
                          <EventCell
                            key={key}
                            event={event || null}
                            rowSpan={1}
                            gridRow={gridRow}
                            gridColumn={gridColumn}
                            day={day}
                            time={time}
                          />
                        );
                      }

                      const { span, shouldRender } = cellInfo;

                      // Don't render cells that are part of a span - CSS Grid handles this automatically
                      if (!shouldRender) {
                        return null;
                      }

                      return (
                        <EventCell
                          key={key}
                          event={event}
                          rowSpan={span}
                          gridRow={gridRow}
                          gridColumn={gridColumn}
                          day={day}
                          time={time}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SunburstBackground({
  location = "paradise-stage",
  stripeColor,
  secondStripeColor,
}: {
  location?: string;
  stripeColor: string;
  secondStripeColor: string;
}) {
  const rays = 24;
  const rayElements = [];

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
              : `linear-gradient(to right, ${secondStripeColor} 0%, ${secondStripeColor} 50%, transparent 50%)`,
          clipPath: `polygon(50% 50%, 40% 0%, 55% 0%)`,
        }}
      />,
    );
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden`}
      style={{ backgroundColor: stripeColor }}
    >
      {rayElements}
    </div>
  );
}

function HeaderCell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center px-1 py-0.5 sm:px-2 sm:py-1"
      style={style}
    >
      <span
        className="text-white font-black text-[10px] sm:text-sm md:text-base lg:text-lg tracking-wide text-center"
        style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
      >
        {children}
      </span>
    </div>
  );
}

function TimeCell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center px-1 py-0.5 sm:px-2 sm:py-1"
      style={style}
    >
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
  gridRow,
  gridColumn,
  day,
  time,
}: {
  event: ScheduleEvent | null;
  rowSpan?: number;
  gridRow?: number;
  gridColumn?: number;
  day?: string;
  time?: string;
}) {
  // Apply explicit grid positioning and row span
  const gridStyle: React.CSSProperties = {};
  if (gridRow !== undefined) {
    if (rowSpan > 1) {
      gridStyle.gridRow = `${gridRow} / span ${rowSpan}`;
    } else {
      gridStyle.gridRow = gridRow;
    }
  } else if (rowSpan > 1) {
    gridStyle.gridRow = `span ${rowSpan}`;
  }
  if (gridColumn !== undefined) {
    gridStyle.gridColumn = gridColumn;
  }

  // Check if this is Wednesday at 6pm for the buffet event
  const isBuffetTime = day === "Wed" && time === "6pm";
  // Check if this is Sunday at 12pm for the community clean up event
  const isCleanupTime = day === "Sun" && time === "12pm";

  // Handle half-hour starts: position in bottom half of the slot
  const needsHalfHourPositioning = event?.startsAtHalfHour && rowSpan === 1;

  if (!event) {
    return (
      <div
        className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center p-0.5 sm:p-1 overflow-hidden"
        style={{
          ...gridStyle,
          opacity: isCleanupTime || isBuffetTime ? 1 : 0.75,
        }}
      >
        <div className="text-center w-full">
          {isBuffetTime && (
            <>
              <p
                className="text-[9px] sm:text-[11px] md:text-[12px] lg:text-[15px] leading-tight"
                style={{
                  color: "#a855f7",
                  fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
                }}
              >
                All You Can Eat Buffet
              </p>
              <p
                className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs leading-tight"
                style={{ color: "#a855f7" }}
              >
                Pi Gaew
              </p>
            </>
          )}
          {isCleanupTime && (
            <p
              className="text-[8px] sm:text-[10px] md:text-[11px] lg:text[10px] leading-tight mt-1"
              style={{
                color: "#a855f7",
                fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
              }}
            >
              10:30 Dacha Park Community Clean Up
            </p>
          )}
          <p className="text-gray-300 font-normal text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight">
            Free Flow
          </p>
        </div>
      </div>
    );
  }

  if (event.isLogo) {
    return (
      <div
        className="bg-black rounded-md sm:rounded-lg flex items-center justify-center p-1"
        style={gridStyle}
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

  // For half-hour starts, position in bottom half of the slot
  if (needsHalfHourPositioning) {
    return (
      <div
        className="flex flex-col justify-end"
        style={{ ...gridStyle, height: "100%" }}
      >
        <div
          className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center p-0.5 sm:p-1 overflow-hidden"
          style={{
            height: "50%",
            opacity: 0.97,
          }}
        >
          <div className="text-center w-full">
            {event.eventId ? (
              <Link
                href={`/event/${createEventSlug(event.eventId, event.name, event.instructor)}`}
                className="hover:underline"
              >
                <p
                  className="text-white font-bold text-[10px] sm:text-[13px] md:text-[14px] lg:text-base leading-tight line-clamp-2"
                  style={{
                    fontFamily:
                      "'Arial Black', 'Arial Bold', Arial, sans-serif",
                  }}
                >
                  {event.name}
                </p>
              </Link>
            ) : (
              <p
                className="text-white font-bold text-[10px] sm:text-[13px] md:text-[14px] lg:text-base leading-tight line-clamp-2"
                style={{
                  fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
                }}
              >
                {event.name}
              </p>
            )}
            {event.instructor &&
              (event.instructorUsername ? (
                <Link
                  href={`/artists/${event.instructorUsername}`}
                  className="hover:underline"
                >
                  <p
                    className="text-white font-bold text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight"
                    style={{ fontFamily: "'Arial', sans-serif" }}
                  >
                    {event.instructor}
                  </p>
                </Link>
              ) : (
                <p
                  className="text-white font-bold text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight"
                  style={{ fontFamily: "'Arial', sans-serif" }}
                >
                  {event.instructor}
                </p>
              ))}
            {isBuffetTime && (
              <>
                <p
                  className="text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight mt-1"
                  style={{
                    color: "#a855f7",
                    fontFamily:
                      "'Arial Black', 'Arial Bold', Arial, sans-serif",
                  }}
                >
                  All You Can Eat Buffet
                </p>
                <p
                  className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs leading-tight"
                  style={{
                    color: "#a855f7",
                    fontFamily: "'Arial', sans-serif",
                  }}
                >
                  Pi Gaew
                </p>
              </>
            )}
            {isCleanupTime && (
              <p
                className="text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight mt-1"
                style={{
                  color: "#a855f7",
                  fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
                }}
              >
                10:30 Dacha Park Community Clean Up
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#4a4a4a] rounded-md sm:rounded-lg flex items-center justify-center p-0.5 sm:p-1 overflow-hidden"
      style={{ ...gridStyle, opacity: 0.97 }}
    >
      <div className="text-center w-full">
        {event.eventId ? (
          <Link
            href={`/event/${createEventSlug(event.eventId, event.name, event.instructor)}`}
            className="hover:underline"
          >
            <p
              className="text-white font-bold text-[10px] sm:text-[13px] md:text-[13px] lg:text-[14px] leading-tight line-clamp-2"
              style={{
                fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
              }}
            >
              {event.name}
            </p>
          </Link>
        ) : (
          <p
            className="text-white font-bold text-[10px] sm:text-[13px] md:text-[14px] lg:text-base leading-tight line-clamp-2"
            style={{
              fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
            }}
          >
            {event.name}
          </p>
        )}
        {event.instructor &&
          (event.instructorUsername ? (
            <Link
              href={`/artists/${event.instructorUsername}`}
              className="hover:underline"
            >
              <p
                className="text-white font-bold text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                {event.instructor}
              </p>
            </Link>
          ) : (
            <p
              className="text-white font-bold text-[9px] sm:text-[11px] md:text-[12px] lg:text-sm leading-tight"
              style={{ fontFamily: "'Arial', sans-serif" }}
            >
              {event.instructor}
            </p>
          ))}
        {isBuffetTime && (
          <>
            <p
              className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[11px] leading-tight"
              style={{
                color: "#a855f7",
                fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
              }}
            >
              All You Can Eat Buffet - Pi Gaew
            </p>
          </>
        )}
        {isCleanupTime && (
          <p
            className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[10px] leading-tight mt-1"
            style={{
              color: "#a855f7",
              fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
            }}
          >
            10:30 Dacha Park Community Clean Up
          </p>
        )}
      </div>
    </div>
  );
}
