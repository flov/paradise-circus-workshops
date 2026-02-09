/**
 * Script to list events (with/without props) and link events to props by deriving from title.
 *
 * Usage:
 *   npx tsx scripts/link-event-props.ts              # List events and suggest matches (dry run)
 *   npx tsx scripts/link-event-props.ts --apply     # Apply prop links to events
 *
 * Requires DATABASE_URL (e.g. from .env).
 */
import "dotenv/config";
import { db } from "../db";
import { events, props } from "../db/schema";
import { eq, asc, inArray } from "drizzle-orm";

type EventRow = { id: number; title: string; propId: number | null; date: string };
type PropRow = { id: number; name: string };

/** Normalize for matching: lowercase, trim. */
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Derive possible prop name from event title.
 * - "Poi Workshop" → "poi"
 * - "Fire Poi Basics" → "fire poi" or "poi" depending on existing props
 * - "Buugeng for Beginners" → "buugeng"
 * Returns the best matching prop (longest match first) or null.
 */
function matchPropFromTitle(title: string, allProps: PropRow[]): PropRow | null {
  // Normalize: lowercase, trim, treat hyphens as spaces so "Fire-Poi" matches prop "fire poi"
  const normalizedTitle = normalize(title).replace(/-/g, " ");
  if (!normalizedTitle) return null;

  // Sort props by name length descending so we match "fire poi" before "poi"
  const sortedProps = [...allProps].sort((a, b) => b.name.length - a.name.length);

  for (const prop of sortedProps) {
    const propNameNorm = normalize(prop.name);
    if (!propNameNorm) continue;
    // Match if title contains the prop name as a whole word (word boundary)
    const regex = new RegExp(`\\b${escapeRegex(propNameNorm)}\\b`, "i");
    if (regex.test(normalizedTitle)) return prop;
  }

  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const apply = process.argv.includes("--apply");

  const allEvents = await db
    .select({ id: events.id, title: events.title, propId: events.propId, date: events.date })
    .from(events)
    .orderBy(asc(events.date), asc(events.id));

  const allProps = await db
    .select({ id: props.id, name: props.name })
    .from(props)
    .orderBy(asc(props.name));

  const withProp = allEvents.filter((e) => e.propId != null);
  const withoutProp = allEvents.filter((e) => e.propId == null);

  console.log("\n📋 Events summary");
  console.log("   Total events:", allEvents.length);
  console.log("   With prop:   ", withProp.length);
  console.log("   Without prop:", withoutProp.length);
  console.log("\n📦 All props:", allProps.map((p) => p.name).join(", ") || "(none)");

  if (withProp.length > 0) {
    const propIds = new Set(withProp.map((e) => e.propId));
    const propNamesById = new Map(allProps.map((p) => [p.id, p.name]));
    console.log("\n✅ Events that already have a prop:");
    for (const e of withProp.slice(0, 30)) {
      const name = e.propId != null ? propNamesById.get(e.propId) : "?";
      console.log(`   #${e.id} ${e.date} | ${e.title} → ${name}`);
    }
    if (withProp.length > 30) console.log(`   ... and ${withProp.length - 30} more`);
  }

  console.log("\n⚠️  Events WITHOUT a prop:");
  if (withoutProp.length === 0) {
    console.log("   (none)");
    return;
  }

  const updates: { eventId: number; title: string; date: string; propId: number; propName: string }[] = [];
  const noMatch: EventRow[] = [];

  for (const e of withoutProp) {
    const matched = matchPropFromTitle(e.title, allProps);
    if (matched) {
      updates.push({
        eventId: e.id,
        title: e.title,
        date: e.date,
        propId: matched.id,
        propName: matched.name,
      });
      console.log(`   #${e.id} ${e.date} | ${e.title} → suggest: "${matched.name}" (id ${matched.id})`);
    } else {
      noMatch.push(e);
      console.log(`   #${e.id} ${e.date} | ${e.title} → (no match)`);
    }
  }

  if (noMatch.length > 0) {
    console.log("\n   No match found for", noMatch.length, "event(s). Add props or match manually in admin.");
  }

  if (apply && updates.length > 0) {
    console.log("\n🔧 Applying", updates.length, "prop link(s)...");
    const dbUrl = process.env.DATABASE_URL ?? "";
    const hostMatch = dbUrl.match(/@([^/]+)\//);
    if (hostMatch) console.log("   Database host:", hostMatch[1]);

    for (const u of updates) {
      await db.update(events).set({ propId: u.propId }).where(eq(events.id, u.eventId));
      console.log(`   #${u.eventId} → ${u.propName}`);
    }

    console.log(`   Updated ${updates.length} event(s).`);

    const eventIds = updates.map((u) => u.eventId);
    const sampleIds = eventIds.slice(0, 5);
    const verify = await db
      .select({ id: events.id, title: events.title, propId: events.propId })
      .from(events)
      .where(inArray(events.id, sampleIds));
    const propNamesById = new Map(allProps.map((p) => [p.id, p.name]));
    console.log("   Verification (sample):");
    for (const row of verify) {
      const propName = row.propId != null ? propNamesById.get(row.propId) : null;
      console.log(`     #${row.id} prop_id=${row.propId} (${propName ?? "null"}) ${row.title.slice(0, 40)}...`);
    }
    console.log("   Done.");
  } else if (updates.length > 0 && !apply) {
    console.log("\n   To apply these links, run: npx tsx scripts/link-event-props.ts --apply");
  }

  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
