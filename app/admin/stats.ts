import { db } from "@/db";
import { events, participations, props, users, userProps } from "@/db/schema";
import {
  count,
  sql,
  eq,
  desc,
  gte,
  and,
  isNotNull,
  inArray,
} from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Types for statistics data
export interface PropStatUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarImageUrl: string | null;
  bio: string | null;
  skillLevel: number;
}

export interface PropStat {
  propId: number;
  propName: string;
  userCount: number;
  users: PropStatUser[];
}

export interface CommunityGrowthPoint {
  week: string; // ISO week format: YYYY-WW
  users: number;
  cumulativeUsers: number;
}

export interface TopInstructor {
  id: number;
  username: string;
  displayName: string | null;
  avatarImageUrl: string | null;
  workshopCount: number;
  totalParticipants: number;
}

export interface SkillDistribution {
  propName: string;
  beginner: number; // 1-3
  intermediate: number; // 4-6
  advanced: number; // 7-10
  averageSkill: number;
}

export interface TimeSlotData {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  hour: number; // 0-23
  count: number;
}

// Event / workshop statistics
export interface EventStatsSummary {
  totalWorkshops: number;
  totalParticipations: number;
  avgFillRatePercent: number;
  upcomingCount: number;
  pastCount: number;
  /** Earliest event date (YYYY-MM-DD), null if no events */
  earliestEventDate: string | null;
  /** Latest event date (YYYY-MM-DD), null if no events */
  latestEventDate: string | null;
}

export interface EventsByPropStat {
  propId: number;
  propName: string;
  eventCount: number;
  totalParticipants: number;
}


/**
 * Get props statistics with user counts and user details (uncached)
 * This function performs the actual database queries
 */
async function getPropsStatsUncached(): Promise<PropStat[]> {
  // Get all props with user counts
  const propsWithCounts = await db
    .select({
      propId: props.id,
      propName: props.name,
      userCount: sql<number>`CAST(COUNT(DISTINCT ${userProps.userId}) AS INTEGER)`,
    })
    .from(props)
    .leftJoin(userProps, eq(props.id, userProps.propId))
    .groupBy(props.id, props.name)
    .orderBy(desc(sql`COUNT(DISTINCT ${userProps.userId})`));

  // Filter to only props with users for batch query
  const propsWithUsers = propsWithCounts.filter((p) => p.userCount > 0);
  const propIds = propsWithUsers.map((p) => p.propId);

  // Batch fetch all users for all props in a single query
  const allUsers =
    propIds.length > 0
      ? await db
          .select({
            propId: userProps.propId,
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarImageUrl: users.avatarImageUrl,
            bio: users.bio,
            skillLevel: userProps.skillLevel,
          })
          .from(userProps)
          .innerJoin(users, eq(userProps.userId, users.id))
          .where(inArray(userProps.propId, propIds))
      : [];

  // Sort by skillLevel descending, then group by propId and limit to top 13 per prop
  allUsers.sort((a, b) => {
    // First sort by propId, then by skillLevel desc
    if (a.propId !== b.propId) {
      return a.propId - b.propId;
    }
    return b.skillLevel - a.skillLevel;
  });

  // Group users by propId and limit to top 13 per prop
  const usersByPropId = new Map<number, PropStatUser[]>();
  for (const user of allUsers) {
    if (!usersByPropId.has(user.propId)) {
      usersByPropId.set(user.propId, []);
    }
    const propUsers = usersByPropId.get(user.propId)!;
    // Limit to 13 users per prop (matching component display limit)
    if (propUsers.length < 13) {
      propUsers.push({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarImageUrl: user.avatarImageUrl,
        bio: user.bio,
        skillLevel: user.skillLevel,
      });
    }
  }

  // Build final result array
  const propsStats: PropStat[] = propsWithCounts.map((prop) => ({
    propId: prop.propId,
    propName: prop.propName,
    userCount: prop.userCount,
    users: usersByPropId.get(prop.propId) || [],
  }));

  return propsStats;
}

/**
 * Get props statistics with user counts and user details
 * Cached for 8 hours to improve performance (60 seconds in development)
 */
export const getPropsStats = unstable_cache(
  async () => getPropsStatsUncached(),
  ["props-stats"],
  {
    revalidate: process.env.NODE_ENV === "development" ? 60 : 28800, // 60 seconds in dev, 8 hours in production
    tags: ["props-stats"],
  },
);

/**
 * Get community growth data (users by week)
 */
export async function getCommunityGrowth(): Promise<CommunityGrowthPoint[]> {
  const weeklyData = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${users.createdAt}), 'IYYY-IW')`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(users)
    .groupBy(sql`DATE_TRUNC('week', ${users.createdAt})`)
    .orderBy(sql`DATE_TRUNC('week', ${users.createdAt})`);

  // Calculate cumulative users
  let cumulative = 0;
  const growthData: CommunityGrowthPoint[] = weeklyData.map((row) => {
    cumulative += row.count;
    return {
      week: row.week,
      users: row.count,
      cumulativeUsers: cumulative,
    };
  });

  return growthData;
}

/**
 * Get top instructors by workshop count
 */
export async function getTopInstructors(limit = 10): Promise<TopInstructor[]> {
  const today = new Date().toISOString().split("T")[0];

  // Get instructors with their workshop counts
  const instructors = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarImageUrl: users.avatarImageUrl,
      workshopCount: sql<number>`CAST(COUNT(DISTINCT ${events.id}) AS INTEGER)`,
      totalParticipants: sql<number>`CAST(COALESCE(SUM(${events.currentBookings}), 0) AS INTEGER)`,
    })
    .from(users)
    .innerJoin(events, eq(users.id, events.instructorId))
    .where(and(eq(events.isPublished, true), eq(events.isWorkshop, true)))
    .groupBy(users.id, users.username, users.displayName, users.avatarImageUrl)
    .orderBy(desc(sql`COUNT(DISTINCT ${events.id})`))
    .limit(limit);

  return instructors;
}

/**
 * Get skill level distribution by prop
 */
export async function getSkillDistribution(): Promise<SkillDistribution[]> {
  const distribution = await db
    .select({
      propName: props.name,
      beginner: sql<number>`CAST(COUNT(CASE WHEN ${userProps.skillLevel} BETWEEN 1 AND 3 THEN 1 END) AS INTEGER)`,
      intermediate: sql<number>`CAST(COUNT(CASE WHEN ${userProps.skillLevel} BETWEEN 4 AND 6 THEN 1 END) AS INTEGER)`,
      advanced: sql<number>`CAST(COUNT(CASE WHEN ${userProps.skillLevel} BETWEEN 7 AND 10 THEN 1 END) AS INTEGER)`,
      averageSkill: sql<number>`CAST(COALESCE(AVG(${userProps.skillLevel}), 0) AS NUMERIC(10,1))`,
    })
    .from(props)
    .leftJoin(userProps, eq(props.id, userProps.propId))
    .groupBy(props.id, props.name)
    .having(sql`COUNT(${userProps.id}) > 0`)
    .orderBy(desc(sql`COUNT(${userProps.id})`));

  return distribution.map((d) => ({
    ...d,
    averageSkill: Number(d.averageSkill),
  }));
}

/**
 * Get workshop time slot distribution (heatmap data)
 */
export async function getWorkshopTimeSlots(): Promise<TimeSlotData[]> {
  const timeSlots = await db
    .select({
      dayOfWeek: sql<number>`CAST(EXTRACT(DOW FROM ${events.date}::date) AS INTEGER)`,
      hour: sql<number>`CAST(EXTRACT(HOUR FROM ${events.startTime}::time) AS INTEGER)`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(events)
    .where(and(eq(events.isPublished, true), eq(events.isWorkshop, true)))
    .groupBy(
      sql`EXTRACT(DOW FROM ${events.date}::date)`,
      sql`EXTRACT(HOUR FROM ${events.startTime}::time)`,
    )
    .orderBy(
      sql`EXTRACT(DOW FROM ${events.date}::date)`,
      sql`EXTRACT(HOUR FROM ${events.startTime}::time)`,
    );

  return timeSlots;
}

export interface EventStatsResult {
  summary: EventStatsSummary;
  byProp: EventsByPropStat[];
}

/**
 * Get event/workshop statistics: summary, by prop
 */
export async function getEventStats(): Promise<EventStatsResult> {
  const today = new Date().toISOString().split("T")[0];

  // Summary: total workshops, participations, fill rate, upcoming vs past, date range
  const [summaryRow] = await db
    .select({
      totalWorkshops: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      totalParticipations: sql<number>`CAST(COALESCE(SUM(${events.currentBookings}), 0) AS INTEGER)`,
      totalCapacity: sql<number>`CAST(COALESCE(SUM(${events.maxCapacity}), 0) AS INTEGER)`,
      upcomingCount: sql<number>`CAST(COUNT(CASE WHEN ${events.date} >= ${today} THEN 1 END) AS INTEGER)`,
      pastCount: sql<number>`CAST(COUNT(CASE WHEN ${events.date} < ${today} THEN 1 END) AS INTEGER)`,
      earliestEventDate: sql<string | null>`MIN(${events.date})::text`,
      latestEventDate: sql<string | null>`MAX(${events.date})::text`,
    })
    .from(events)
    .where(and(eq(events.isPublished, true), eq(events.isWorkshop, true)));

  const totalWorkshops = summaryRow?.totalWorkshops ?? 0;
  const totalParticipations = summaryRow?.totalParticipations ?? 0;
  const totalCapacity = summaryRow?.totalCapacity ?? 0;
  const avgFillRatePercent =
    totalCapacity > 0 ? Math.round((totalParticipations / totalCapacity) * 100) : 0;

  const summaryData: EventStatsSummary = {
    totalWorkshops,
    totalParticipations,
    avgFillRatePercent,
    upcomingCount: summaryRow?.upcomingCount ?? 0,
    pastCount: summaryRow?.pastCount ?? 0,
    earliestEventDate: summaryRow?.earliestEventDate ?? null,
    latestEventDate: summaryRow?.latestEventDate ?? null,
  };

  // By prop: event count and total participants per prop (only events with a prop)
  const byPropRows = await db
    .select({
      propId: props.id,
      propName: props.name,
      eventCount: sql<number>`CAST(COUNT(${events.id}) AS INTEGER)`,
      totalParticipants: sql<number>`CAST(COALESCE(SUM(${events.currentBookings}), 0) AS INTEGER)`,
    })
    .from(events)
    .innerJoin(props, eq(events.propId, props.id))
    .where(and(eq(events.isPublished, true), eq(events.isWorkshop, true)))
    .groupBy(props.id, props.name)
    .orderBy(desc(sql`COUNT(${events.id})`));

  const byProp: EventsByPropStat[] = byPropRows.map((row) => ({
    propId: row.propId,
    propName: row.propName,
    eventCount: row.eventCount,
    totalParticipants: row.totalParticipants,
  }));

  return { summary: summaryData, byProp };
}
