import { db } from "@/db";
import { bookings, workshops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

type Booking = {
  id: number;
  workshop_id: number;
  participant_name: string;
  participant_email: string;
  phone: string | null;
  notes: string | null;
  booking_date: string;
};

type Workshop = {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor: string;
  what_to_bring?: string | null;
};

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const bookingResults = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, parseInt(id)));

  if (bookingResults.length === 0) {
    notFound();
  }

  const bookingData = bookingResults[0];
  const booking: Booking = {
    id: bookingData.id,
    workshop_id: bookingData.workshopId,
    participant_name: bookingData.participantName,
    participant_email: bookingData.participantEmail,
    phone: bookingData.phone,
    notes: bookingData.notes,
    booking_date: bookingData.bookingDate.toISOString(),
  };

  const workshopResults = await db
    .select({
      id: workshops.id,
      title: workshops.title,
      date: workshops.date,
      startTime: workshops.startTime,
      endTime: workshops.endTime,
      location: workshops.location,
      instructor: workshops.instructor,
      whatToBring: workshops.whatToBring,
    })
    .from(workshops)
    .where(eq(workshops.id, bookingData.workshopId));

  const workshopData = workshopResults[0];
  const workshop: Workshop = {
    id: workshopData.id,
    title: workshopData.title,
    date: workshopData.date,
    start_time: workshopData.startTime,
    end_time: workshopData.endTime,
    location: workshopData.location || "",
    instructor: workshopData.instructor,
    what_to_bring: workshopData.whatToBring,
  };

  // Format date
  const date = new Date(workshop.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your spot has been reserved. We'll send a confirmation email
            shortly.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Booking Details</CardTitle>
              <Badge variant="outline">Booking #{booking.id}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-3">
                {workshop.title}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {formatTime(workshop.start_time)} -{" "}
                    {formatTime(workshop.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{workshop.location}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground mb-2">
                Participant Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {booking.participant_email}
                  </span>
                </div>
                {booking.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{booking.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-2">
                  Your Notes
                </h4>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground mb-2">
                What to Bring
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {workshop.what_to_bring
                  ? workshop.what_to_bring
                      .split('\n')
                      .map((item) => item.trim())
                      .filter((item) => item.length > 0)
                      .map((item, index) => <li key={index}>{item}</li>)
                  : null}
                <li>Enthusiasm and a willingness to learn!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">Browse More Workshops</Button>
          </Link>
          <PrintButton />
        </div>

        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-semibold text-foreground mb-2 text-sm">
            What's Next?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your email for the confirmation details</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
