import { db } from "@/db";
import { activityLogs } from "@/db/schema";

interface LogActivityParams {
  userId?: number | null;
  actorName: string;
  actorUsername?: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget activity logger. Failures are silently caught
 * so logging never breaks mutations.
 *
 * `actorUsername` is automatically merged into metadata so the feed
 * can link to the actor's profile without an extra DB query.
 */
export function logActivity(params: LogActivityParams): void {
  const metadata = {
    ...(params.actorUsername ? { actorUsername: params.actorUsername } : {}),
    ...params.metadata,
  };

  db.insert(activityLogs)
    .values({
      userId: params.userId ?? null,
      actorName: params.actorName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      entityLabel: params.entityLabel ?? null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .then(() => {})
    .catch((error) => {
      console.error("Failed to log activity:", error);
    });
}
