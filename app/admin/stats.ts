import { db } from "@/db";
import { events, participations, props, users, userProps } from "@/db/schema";
import { count, sql, eq, desc, gte, and, isNotNull } from "drizzle-orm";

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

/**
 * Get props statistics with user counts and user details
 */
export async function getPropsStats(): Promise<PropStat[]> {
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

  // Get users for each prop
  const propsStats: PropStat[] = [];

  for (const prop of propsWithCounts) {
    if (prop.userCount === 0) {
      propsStats.push({
        propId: prop.propId,
        propName: prop.propName,
        userCount: 0,
        users: [],
      });
      continue;
    }

    const propUsers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarImageUrl: users.avatarImageUrl,
        bio: users.bio,
        skillLevel: userProps.skillLevel,
      })
      .from(userProps)
      .innerJoin(users, eq(userProps.userId, users.id))
      .where(eq(userProps.propId, prop.propId))
      .orderBy(desc(userProps.skillLevel));

    propsStats.push({
      propId: prop.propId,
      propName: prop.propName,
      userCount: prop.userCount,
      users: propUsers,
    });
  }

  return propsStats;
}

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
      sql`EXTRACT(HOUR FROM ${events.startTime}::time)`
    )
    .orderBy(
      sql`EXTRACT(DOW FROM ${events.date}::date)`,
      sql`EXTRACT(HOUR FROM ${events.startTime}::time)`
    );

  return timeSlots;
}

