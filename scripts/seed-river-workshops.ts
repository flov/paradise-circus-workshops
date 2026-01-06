// Load environment variables from .env files
import { config } from "dotenv";
config();

import { db } from "../db";
import { workshops } from "../db/schema";

// Helper function to parse workshop title and extract instructor
function parseWorkshop(fullTitle: string): {
  title: string;
  instructor: string;
} {
  // Handle "Community Meeting" - no instructor
  if (fullTitle === "Community Meeting") {
    return { title: "Community Meeting", instructor: "" };
  }

  // Handle special cases with time prefix
  const timePrefixMatch = fullTitle.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
  if (timePrefixMatch) {
    const rest = timePrefixMatch[2];
    const parts = rest.trim().split(/\s+/);
    const instructor = parts[parts.length - 1];
    const title = parts.slice(0, -1).join(" ");
    return { title, instructor };
  }

  // Handle "Leviwand Sam & Luna" - instructor has multiple words
  if (fullTitle.includes("Sam & Luna")) {
    return { title: "Leviwand", instructor: "Sam & Luna" };
  }

  // Handle "Joe P" - instructor has initial
  if (fullTitle.includes("Joe P")) {
    const title = fullTitle.replace(/\s+Joe P$/, "").trim();
    return { title, instructor: "Joe P" };
  }

  // Handle "Rene FocusFire" - instructor has multiple words
  if (fullTitle.includes("Rene FocusFire")) {
    const title = fullTitle.replace(/\s+Rene FocusFire$/, "").trim();
    return { title, instructor: "Rene FocusFire" };
  }

  // Default: last word is instructor
  const parts = fullTitle.trim().split(/\s+/);
  const instructor = parts[parts.length - 1];
  const title = parts.slice(0, -1).join(" ");

  return { title, instructor };
}

// Workshop data structure
interface WorkshopData {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  fullTitle: string; // Full title as shown in timetable
}

const workshopData: WorkshopData[] = [
  // Monday (Jan 5, 2026)
  {
    date: "2026-01-05",
    startTime: "13:00:00",
    endTime: "14:00:00",
    fullTitle: "Community Meeting",
  },

  // Tuesday (Jan 6, 2026)
  {
    date: "2026-01-06",
    startTime: "13:00:00",
    endTime: "14:00:00",
    fullTitle: "Journaling For Mental Health Freya",
  },
  {
    date: "2026-01-06",
    startTime: "15:30:00",
    endTime: "16:00:00",
    fullTitle: "3:30 Social Media Onboarding Kevin",
  },
  {
    date: "2026-01-06",
    startTime: "16:00:00",
    endTime: "17:00:00",
    fullTitle: "Banquine Angie",
  },
  {
    date: "2026-01-06",
    startTime: "17:00:00",
    endTime: "18:00:00",
    fullTitle: "Poi Juggling Frenchie",
  },

  // Wednesday (Jan 7, 2026)
  {
    date: "2026-01-07",
    startTime: "10:00:00",
    endTime: "11:00:00",
    fullTitle: "Poi Kevin",
  },
  {
    date: "2026-01-07",
    startTime: "11:00:00",
    endTime: "12:00:00",
    fullTitle: "Multi Prop Kevin",
  },
  {
    date: "2026-01-07",
    startTime: "12:00:00",
    endTime: "13:00:00",
    fullTitle: "Musical Improv Chanel",
  },
  {
    date: "2026-01-07",
    startTime: "13:00:00",
    endTime: "14:00:00",
    fullTitle: "Silk Reeling QiGong Niklas",
  },
  {
    date: "2026-01-07",
    startTime: "14:00:00",
    endTime: "15:00:00",
    fullTitle: "Flower Stick Marta",
  },
  {
    date: "2026-01-07",
    startTime: "15:00:00",
    endTime: "16:00:00",
    fullTitle: "Leviwand Sam & Luna",
  },
  {
    date: "2026-01-07",
    startTime: "15:00:00",
    endTime: "16:00:00",
    fullTitle: "Clothes Cutting Marta",
  },
  {
    date: "2026-01-07",
    startTime: "16:00:00",
    endTime: "17:00:00",
    fullTitle: "About Flow Momo",
  },
  {
    date: "2026-01-07",
    startTime: "17:00:00",
    endTime: "18:00:00",
    fullTitle: "Clown Class Joe P",
  },

  // Thursday (Jan 8, 2026)
  {
    date: "2026-01-08",
    startTime: "12:00:00",
    endTime: "13:00:00",
    fullTitle: "Feedback Session Joe P",
  },
  {
    date: "2026-01-08",
    startTime: "14:00:00",
    endTime: "15:00:00",
    fullTitle: "Hula Hoop Beg Lis",
  },
  {
    date: "2026-01-08",
    startTime: "15:00:00",
    endTime: "16:00:00",
    fullTitle: "Intro to Contact Staff Lux",
  },
  {
    date: "2026-01-08",
    startTime: "16:00:00",
    endTime: "17:00:00",
    fullTitle: "Juggling Passing Chloe",
  },
  {
    date: "2026-01-08",
    startTime: "17:00:00",
    endTime: "18:00:00",
    fullTitle: "Workshop Creation Rebecca",
  },

  // Friday (Jan 9, 2026)
  {
    date: "2026-01-09",
    startTime: "13:00:00",
    endTime: "14:00:00",
    fullTitle: "Silk Fans Valentina",
  },
  {
    date: "2026-01-09",
    startTime: "14:00:00",
    endTime: "15:00:00",
    fullTitle: "Clowning Valentina",
  },
  {
    date: "2026-01-09",
    startTime: "15:00:00",
    endTime: "16:00:00",
    fullTitle: "Beginner Contact staff tricks Joey",
  },
  {
    date: "2026-01-09",
    startTime: "16:00:00",
    endTime: "17:00:00",
    fullTitle: "Contact staff All Levels Joey",
  },
  {
    date: "2026-01-09",
    startTime: "17:00:00",
    endTime: "18:00:00",
    fullTitle: "Stall Chaser Poi Silvio",
  },

  // Sunday (Jan 11, 2026)
  {
    date: "2026-01-11",
    startTime: "15:00:00",
    endTime: "16:00:00",
    fullTitle: "Macrame Keychain Marle",
  },
  {
    date: "2026-01-11",
    startTime: "16:00:00",
    endTime: "17:00:00",
    fullTitle: "Double Staff Kohei",
  },
  {
    date: "2026-01-11",
    startTime: "17:00:00",
    endTime: "18:00:00",
    fullTitle: "Flowersticks Rene FocusFire",
  },
];

async function seedRiverWorkshops() {
  console.log("Starting to seed paradise river workshops...");

  try {
    for (const workshop of workshopData) {
      const { title, instructor } = parseWorkshop(workshop.fullTitle);

      // Handle "Community Meeting" which doesn't have an instructor
      const finalInstructor = instructor || "TBD";

      await db.insert(workshops).values({
        title,
        instructor: finalInstructor,
        date: workshop.date,
        startTime: workshop.startTime,
        endTime: workshop.endTime,
        location: "paradise river",
        description: null,
        maxCapacity: 20,
        currentBookings: 0,
      });

      console.log(
        `✓ Created: ${title} - ${finalInstructor} on ${workshop.date} at ${workshop.startTime}`,
      );
    }

    console.log(`\n✅ Successfully seeded ${workshopData.length} workshops!`);
  } catch (error) {
    console.error("❌ Error seeding workshops:", error);
    process.exit(1);
  }
}

// Run the seed function
seedRiverWorkshops()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
