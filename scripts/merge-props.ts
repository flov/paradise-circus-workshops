/**
 * Script to merge one prop into another.
 * 
 * Usage: npx tsx scripts/merge-props.ts <source_prop_name> <target_prop_name>
 * Example: npx tsx scripts/merge-props.ts "buungeng" "buugeng"
 * 
 * This script will:
 * 1. Find the source prop (x) and target prop (y)
 * 2. Update all user_props references from x to y
 * 3. Update all events references from x to y
 * 4. Delete the source prop (x)
 */

import { db } from "../db";
import { props, userProps, events } from "../db/schema";
import { eq, sql } from "drizzle-orm";

async function mergeProps(sourcePropName: string, targetPropName: string) {
  try {
    console.log(`\n🔄 Starting merge: "${sourcePropName}" → "${targetPropName}"\n`);

    // Validate inputs
    if (!sourcePropName || !targetPropName) {
      console.error("❌ Error: Both source and target prop names are required.");
      console.log("\nUsage: npx tsx scripts/merge-props.ts <source_prop_name> <target_prop_name>");
      console.log('Example: npx tsx scripts/merge-props.ts "buungeng" "buugeng"');
      process.exit(1);
    }

    // Normalize prop names for comparison
    const normalizedSourceName = sourcePropName.trim().toLowerCase();
    const normalizedTargetName = targetPropName.trim().toLowerCase();

    // Find source prop (case-insensitive)
    const sourceProp = await db
      .select({ id: props.id, name: props.name })
      .from(props)
      .where(sql`LOWER(TRIM(${props.name})) = ${normalizedSourceName}`)
      .limit(1);

    if (sourceProp.length === 0) {
      console.error(`❌ Source prop "${sourcePropName}" not found.`);
      console.log("\nAvailable props:");
      const allProps = await db
        .select({ name: props.name })
        .from(props)
        .orderBy(props.name);
      allProps.forEach((p) => console.log(`  - "${p.name}"`));
      process.exit(1);
    }

    // Find target prop (case-insensitive)
    const targetProp = await db
      .select({ id: props.id, name: props.name })
      .from(props)
      .where(sql`LOWER(TRIM(${props.name})) = ${normalizedTargetName}`)
      .limit(1);

    if (targetProp.length === 0) {
      console.log(`⚠️  Target prop "${targetPropName}" not found. Creating it...`);
      // Create target prop if it doesn't exist
      const newProp = await db
        .insert(props)
        .values({ name: targetPropName.trim() })
        .returning({ id: props.id, name: props.name });
      targetProp.push(newProp[0]);
      console.log(`✅ Created target prop: "${targetProp[0].name}" (ID: ${targetProp[0].id})\n`);
    }

    const sourceId = sourceProp[0].id;
    const targetId = targetProp[0].id;
    const sourceName = sourceProp[0].name;
    const targetName = targetProp[0].name;

    console.log(`📋 Found source prop: "${sourceName}" (ID: ${sourceId})`);
    console.log(`📋 Found target prop: "${targetName}" (ID: ${targetId})\n`);

    if (sourceId === targetId) {
      console.log("✅ Source and target props are the same. No action needed.");
      process.exit(0);
    }

    // Count references before update
    const userPropsCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userProps)
      .where(eq(userProps.propId, sourceId));

    const eventsCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(events)
      .where(eq(events.propId, sourceId));

    const userPropsToUpdate = Number(userPropsCount[0]?.count || 0);
    const eventsToUpdate = Number(eventsCount[0]?.count || 0);

    console.log(`📊 References to update:`);
    console.log(`   - user_props: ${userPropsToUpdate}`);
    console.log(`   - events: ${eventsToUpdate}\n`);

    if (userPropsToUpdate === 0 && eventsToUpdate === 0) {
      console.log("ℹ️  No references found. Only deleting source prop.\n");
    }

    // Update user_props references
    let updatedUserProps = 0;
    if (userPropsToUpdate > 0) {
      const updated = await db
        .update(userProps)
        .set({ propId: targetId })
        .where(eq(userProps.propId, sourceId))
        .returning({ id: userProps.id });
      updatedUserProps = updated.length;
      console.log(`✅ Updated ${updatedUserProps} user_props record(s)`);
    }

    // Update events references
    let updatedEvents = 0;
    if (eventsToUpdate > 0) {
      const updated = await db
        .update(events)
        .set({ propId: targetId })
        .where(eq(events.propId, sourceId))
        .returning({ id: events.id });
      updatedEvents = updated.length;
      console.log(`✅ Updated ${updatedEvents} events record(s)`);
    }

    // Delete source prop
    await db.delete(props).where(eq(props.id, sourceId));
    console.log(`✅ Deleted source prop "${sourceName}" (ID: ${sourceId})\n`);

    console.log(`🎉 Successfully merged "${sourceName}" into "${targetName}"`);
    console.log(`   Summary:`);
    console.log(`   - Updated ${updatedUserProps} user_props`);
    console.log(`   - Updated ${updatedEvents} events`);
    console.log(`   - Deleted source prop "${sourceName}"`);
    console.log(`   - All references now point to "${targetName}"\n`);
  } catch (error) {
    console.error("\n❌ Error merging props:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Error: Missing required arguments.");
  console.log("\nUsage: npx tsx scripts/merge-props.ts <source_prop_name> <target_prop_name>");
  console.log('Example: npx tsx scripts/merge-props.ts "buungeng" "buugeng"');
  console.log("\nArguments:");
  console.log("  source_prop_name  - The prop to merge (will be deleted)");
  console.log("  target_prop_name  - The prop to merge into (will be kept)");
  process.exit(1);
}

const [sourcePropName, targetPropName] = args;

// Run the merge
mergeProps(sourcePropName, targetPropName)
  .then(() => {
    console.log("✅ Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
