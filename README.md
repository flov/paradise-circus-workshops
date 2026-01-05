# Paradise Circus Workshop Booking Platform

A full-stack workshop booking system built with Next.js 16, featuring a public timetable, booking system, admin dashboard, and email notifications.

## Features

### Public-Facing
- 🎪 **Workshop Timetable**: Browse upcoming circus workshops with a vibrant, circus-themed design
- 📅 **Workshop Details**: View comprehensive information about each workshop including instructor, date, time, location, and capacity
- 🎫 **Online Booking**: Easy-to-use booking form with real-time capacity tracking
- ✅ **Booking Confirmation**: Beautiful confirmation page with all booking details

### Admin Dashboard
- 📊 **Statistics Dashboard**: View key metrics including total workshops, bookings, and capacity
- ✏️ **Workshop Management**: Create, edit, and delete workshops with an intuitive interface
- 👥 **Booking Management**: View all bookings and manage participant registrations
- 🔄 **Real-time Updates**: Automatic capacity tracking and data synchronization

### Email Notifications
- 📧 **Participant Confirmations**: Automated confirmation emails with workshop details
- 🔔 **Admin Notifications**: Receive notifications when new bookings are made
- 🎨 **Beautiful Templates**: Professional HTML email templates with circus branding

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Neon PostgreSQL (serverless)
- **Styling**: Tailwind CSS v4 with custom circus-themed color palette
- **UI Components**: shadcn/ui
- **Email**: Ready for integration with Resend, SendGrid, or similar services

## Database Schema

The application uses three main tables:

### Workshops
- Workshop details (title, description, instructor)
- Scheduling (date, start time, end time, location)
- Capacity management (max capacity, current bookings)

### Bookings
- Participant information (name, email, phone)
- Workshop reference
- Booking status and notes

### Admin Settings
- Configurable system settings
- Admin email addresses
- Booking preferences

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Neon PostgreSQL database (already connected)

### Database Setup

1. Run the database creation script:
   - The schema is in `scripts/001-create-schema.sql`
   - Sample data is in `scripts/002-seed-sample-data.sql`

2. These scripts will create:
   - All necessary tables with proper relationships
   - Indexes for optimal performance
   - Sample workshop data to get started

### Environment Variables

The following environment variables are already configured:
- `DATABASE_URL` - Neon PostgreSQL connection string

Optional environment variables for email:
- `ADMIN_EMAIL` - Admin email address for notifications (default: admin@paradisecircus.com)
- `RESEND_API_KEY` - API key for Resend email service (if using Resend)

### Email Integration

The email system is currently set up to log emails to the console. To enable actual email sending:

1. **Using Resend** (recommended):
   ```bash
   npm install resend
   ```
   
   Add your API key to environment variables, then uncomment the Resend code in `lib/email.ts`

2. **Using SendGrid** or other providers:
   - Install the appropriate SDK
   - Update the email functions in `lib/email.ts` with your provider's API calls

## Application Routes

### Public Routes
- `/` - Workshop timetable (homepage)
- `/book/[id]` - Individual workshop booking page
- `/booking-confirmation/[id]` - Booking confirmation page

### Admin Routes
- `/admin` - Admin dashboard with statistics and management tools

## Design System

The application features a custom circus-themed design:
- **Primary Color**: Warm red-orange (circus tent inspired)
- **Secondary Color**: Golden yellow (spotlight inspired)
- **Background**: Warm cream tones
- **Typography**: Clean, readable fonts (Geist Sans)

## Key Features Explained

### Real-time Capacity Management
- Automatic tracking of available spots
- Prevention of overbooking
- Visual indicators for availability status

### Responsive Design
- Mobile-first approach
- Adapts seamlessly to all screen sizes
- Touch-friendly interface

### Server Actions
- Secure server-side data mutations
- Automatic revalidation of cached pages
- Optimistic UI updates

## Admin Dashboard Usage

1. **View Statistics**: See overview of workshops and bookings
2. **Add Workshop**: Click "Add Workshop" button to create a new workshop
3. **Edit Workshop**: Click the pencil icon next to any workshop to edit details
4. **Delete Workshop**: Click the trash icon to remove a workshop (also deletes associated bookings)
5. **Manage Bookings**: Switch to the "Bookings" tab to view and cancel bookings

## Production Considerations

Before deploying to production:

1. **Email Service**: Set up and configure your email service provider
2. **Authentication**: Add authentication to protect the `/admin` routes
3. **Error Handling**: Implement comprehensive error logging and monitoring
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Backup Strategy**: Set up automated database backups
6. **Environment Variables**: Ensure all production env vars are properly configured

## Support

For questions or issues, contact the Paradise Circus team.

---

Built with ❤️ for Paradise Circus - Where dreams take flight! 🎪
