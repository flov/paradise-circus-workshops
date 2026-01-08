import { db } from '@/db';
import { workshops, bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BookWorkshopButton } from '@/components/book-workshop-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  isWorkshopPast,
  getUserName,
  getUserEmail,
  parseWorkshopSlug,
  createWorkshopSlug,
} from '@/lib/utils';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { AvatarStack } from '@/components/avatar-stack';

type Workshop = {
  id: number;
  title: string;
  description: string;
  instructor: string;
  date: string;
  start_time: string;
  end_time: string;
  current_bookings: number;
  location: string;
};

export default async function BookWorkshopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Parse the slug to extract the workshop ID
  const workshopId = parseWorkshopSlug(slug);

  if (!workshopId) {
    notFound();
  }

  const workshopResults = await db
    .select()
    .from(workshops)
    .where(eq(workshops.id, workshopId));

  if (workshopResults.length === 0) {
    notFound();
  }

  const workshopData = workshopResults[0];
  const workshop: Workshop = {
    id: workshopData.id,
    title: workshopData.title,
    description: workshopData.description || '',
    instructor: workshopData.instructor,
    date: workshopData.date,
    start_time: workshopData.startTime,
    end_time: workshopData.endTime,
    current_bookings: workshopData.currentBookings,
    location: workshopData.location || '',
  };

  // If the slug is in old format (numeric only), redirect to new format for SEO
  if (/^\d+$/.test(slug)) {
    const newSlug = createWorkshopSlug(
      workshop.id,
      workshop.title,
      workshop.instructor
    );
    redirect(`/book/${newSlug}`);
  }

  // Format date
  const date = new Date(workshop.date);
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

  const isPast = isWorkshopPast(workshop.date, workshop.end_time);

  // Get user data on server side for faster loading
  const { userId } = await auth();
  let initialUserName = '';
  let initialUserEmail = '';

  if (userId) {
    const user = await currentUser();
    if (user) {
      initialUserName = getUserName(user);
      initialUserEmail = getUserEmail(user);
    }
  }

  // Fetch bookings for this workshop with Clerk user IDs
  const bookingsData = await db
    .select({
      participantName: bookings.participantName,
      participantEmail: bookings.participantEmail,
      clerkUserId: bookings.clerkUserId,
    })
    .from(bookings)
    .where(eq(bookings.workshopId, workshopId));

  // Fetch Clerk user data for participants with userIds
  const clerk = await clerkClient();
  const participants = await Promise.all(
    bookingsData.map(async (booking) => {
      let imageUrl: string | null = null;

      if (booking.clerkUserId) {
        try {
          const clerkUser = await clerk.users.getUser(booking.clerkUserId);
          imageUrl = clerkUser.imageUrl || null;
        } catch (error) {
          // If user fetch fails, continue without image
          console.error(
            `Failed to fetch Clerk user ${booking.clerkUserId}:`,
            error
          );
        }
      }

      return {
        name: booking.participantName,
        email: booking.participantEmail,
        imageUrl,
      };
    })
  );

  return (
    <div className='min-h-screen bg-background'>
      <div className='border-b border-border bg-card'>
        <div className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link href='/'>
              <Button variant='ghost' size='sm'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Timetable
              </Button>
            </Link>
            <h1 className='text-2xl font-bold text-foreground text-balance'>
              Book Your Workshop
            </h1>
          </div>
        </div>
      </div>

      <main className='mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
        <div>
          {/* Workshop Details */}
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between gap-2 mb-2'>
                <CardTitle className='text-2xl text-balance'>
                  {workshop.title}
                </CardTitle>
                {isPast && (
                  <Badge
                    variant='secondary'
                    className='bg-muted text-muted-foreground'
                  >
                    Past Workshop
                  </Badge>
                )}
              </div>
              <CardDescription className='text-pretty'>
                {workshop.description}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-3 text-sm'>
                  <Calendar className='h-5 w-5 text-primary' />
                  <div>
                    <div className='font-medium text-foreground'>Date</div>
                    <div className='text-muted-foreground'>{formattedDate}</div>
                  </div>
                </div>
                <div className='flex items-center gap-3 text-sm'>
                  <Clock className='h-5 w-5 text-primary' />
                  <div>
                    <div className='font-medium text-foreground'>Time</div>
                    <div className='text-muted-foreground'>
                      {formatTime(workshop.start_time)} -{' '}
                      {formatTime(workshop.end_time)}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3 text-sm'>
                  <MapPin className='h-5 w-5 text-primary' />
                  <div>
                    <div className='font-medium text-foreground'>Location</div>
                    <div className='text-muted-foreground'>
                      {workshop.location}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3 text-sm'>
                  <Users className='h-5 w-5 text-primary' />
                  <div>
                    <div className='font-medium text-foreground'>
                      Instructor
                    </div>
                    <div className='text-muted-foreground'>
                      {workshop.instructor}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3 text-sm'>
                  <UserCheck className='h-5 w-5 text-primary' />
                  <div className='font-medium text-foreground'>
                      {workshop.current_bookings}{' '}
                      {workshop.current_bookings === 1
                        ? 'Participant'
                        : 'Participants'}
                  </div>
                  {participants.length > 0 && (
                    <div className='mt-1'>
                      <AvatarStack participants={participants} size='sm' />
                    </div>
                  )}
                </div>
              </div>

              <BookWorkshopButton
                workshopId={workshop.id}
                isPast={isPast}
                isAuthenticated={!!userId}
                userName={initialUserName}
                userEmail={initialUserEmail}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
