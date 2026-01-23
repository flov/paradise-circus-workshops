import { InstagramTimetable } from "@/components/instagram-timetable";
import { InstagramWeekNavigation } from "@/components/instagram-week-navigation";
import { getInstagramTimetableData } from "@/app/actions";
import { Suspense } from "react";

async function InstagramTimetableWrapper({ date, location }: { date: string | null; location: string }) {
  const scheduleData = await getInstagramTimetableData(date || undefined, location);

  return (
    <InstagramTimetable data={scheduleData} aspectRatio="landscape" location={location} />
  );
}

export default async function InstagramPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string }>;
}) {
  const params = await searchParams;
  const date = params.date || null;
  const location = params.location || "paradise-stage";

  return (
    <div className="min-h-screen bg-neutral-900 p-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <Suspense fallback={<div className="h-16 mb-6" />}>
          <InstagramWeekNavigation />
        </Suspense>
        <InstagramTimetableWrapper date={date} location={location} />
      </div>
    </div>
  );
}
