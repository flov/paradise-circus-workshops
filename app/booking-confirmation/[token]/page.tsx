import { db } from '@/db';
import { bookings, events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import { CancelBookingButton } from '@/components/cancel-booking-button';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createEventSlug } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import type { Booking, Event } from '@/db/schema';

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const bookingResults = await db
    .select()
    .from(bookings)
    .where(eq(bookings.confirmationToken, token));

  if (bookingResults.length === 0) {
    notFound();
  }

  const booking = bookingResults[0];

  const eventResults = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      location: events.location,
      instructor: events.instructor,
      description: events.description,
      whatToBring: events.whatToBring,
    })
    .from(events)
    .where(eq(events.id, booking.eventId));

  const event = eventResults[0];

  // Format date
  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Create event slug for back button
  const eventSlug = createEventSlug(
    eventData.id,
    eventData.title,
    eventData.instructor,
  );

  return (
    <div className='min-h-screen bg-background'>
      <div className='border-b border-border bg-card'>
        <div className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link href={`/event/${eventSlug}`}>
              <Button variant='ghost' size='sm'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Event
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <main className='mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4'>
            <CheckCircle className='h-8 w-8 text-primary' />
          </div>
          <h1 className='text-3xl font-bold text-foreground mb-2 text-balance'>
            Booking Confirmed!
          </h1>
          <p className='text-muted-foreground text-lg'>
            Your spot has been reserved. We'll send a confirmation email
            shortly.
          </p>
        </div>

        <Card className='mb-6'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-xl'>Booking Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='font-semibold text-lg text-foreground mb-3'>
                {event.title}
              </h3>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-3'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span className='text-foreground'>{formattedDate}</span>
                </div>
                <div className='flex items-center gap-3'>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                  <span className='text-foreground'>
                    {formatTime(event.startTime)} -{' '}
                    {formatTime(event.endTime)}
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <MapPin className='h-4 w-4 text-muted-foreground' />
                  <span className='text-foreground'>{event.location}</span>
                </div>
              </div>
            </div>

            <div className='pt-4 border-t border-border'>
              <h4 className='font-semibold text-foreground mb-2'>
                Participant Information
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-3'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  <span className='text-foreground'>
                    {booking.participantName}
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <span className='text-foreground'>
                    {booking.participantEmail}
                  </span>
                </div>
                {booking.phone && (
                  <div className='flex items-center gap-3'>
                    <Phone className='h-4 w-4 text-muted-foreground' />
                    <span className='text-foreground'>{booking.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className='pt-4 border-t border-border'>
                <h4 className='font-semibold text-foreground mb-2'>
                  Your Notes
                </h4>
                <p className='text-sm text-muted-foreground'>{booking.notes}</p>
              </div>
            )}

            {event.whatToBring && (
              <div className='pt-4 border-t border-border'>
                <h4 className='font-semibold text-foreground mb-2'>
                  What to Bring
                </h4>
                <ul className='text-sm text-muted-foreground space-y-1 list-disc list-inside'>
                  {event.whatToBring
                    .split('\n')
                    .map((item) => item.trim())
                    .filter((item) => item.length > 0)
                    .map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                </ul>
              </div>
            )}

            <div className='pt-4 border-t border-border space-y-3'>
              <AddToCalendarButton
                confirmationToken={bookingData.confirmationToken}
                eventData={{
                  title: eventData.title,
                  date: eventData.date,
                  startTime: eventData.startTime,
                  endTime: eventData.endTime,
                  location: eventData.location,
                  instructor: eventData.instructor,
                  description: eventData.description,
                  whatToBring: eventData.whatToBring,
                  bookingId: bookingData.id,
                  confirmationToken: bookingData.confirmationToken,
                }}
                className='w-full'
              />
              <Link href='/'>
                <Button className='w-full'>Browse More Events</Button>
              </Link>
              <CancelBookingButton
                bookingId={bookingData.id}
                variant='outline'
                className='w-full mt-2'
              />
            </div>
          </CardContent>
        </Card>

        <div className='mt-4 p-4 rounded-lg bg-muted/50 border border-border'>
          <h3 className='font-semibold text-foreground mb-2 text-sm'>
            What's Next?
          </h3>
          <ul className='text-sm text-muted-foreground space-y-1 list-disc list-inside'>
            <li>Check your email for the confirmation details</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
