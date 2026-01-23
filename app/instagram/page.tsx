import { InstagramTimetable } from "@/components/instagram-timetable";
import { InstagramWeekNavigation } from "@/components/instagram-week-navigation";
import { getInstagramTimetableData } from "@/app/actions";
import { Suspense } from "react";

async function InstagramTimetableWrapper({ date }: { date: string | null }) {
  const scheduleData = await getInstagramTimetableData(date || undefined);

  return (
    <InstagramTimetable data={scheduleData} aspectRatio="landscape" />
  );
}

export default async function InstagramPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date || null;

  return (
    <div className="min-h-screen bg-neutral-900 p-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <Suspense fallback={<div className="h-16 mb-6" />}>
          <InstagramWeekNavigation />
        </Suspense>
        <InstagramTimetableWrapper date={date} />
      </div>
    </div>
  );
}
