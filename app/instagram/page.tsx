import { InstagramTimetable } from "@/components/instagram-timetable";
import { getInstagramTimetableData } from "@/app/actions";

export default async function InstagramPage() {
  const scheduleData = await getInstagramTimetableData();

  return (
    <div className="min-h-screen bg-neutral-900 p-4">
      <div className="max-w-7xl mx-auto flex justify-center">
        <InstagramTimetable data={scheduleData} aspectRatio="landscape" />
      </div>
    </div>
  );
}
