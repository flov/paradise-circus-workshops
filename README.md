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
- **Email**: Integrated with Resend for automated email notifications

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

### Environment Variables

The following environment variables are already configured:
- `DATABASE_URL` - Neon PostgreSQL connection string

Required environment variables for email:
- `RESEND_API_KEY` - API key for Resend email service (get from https://resend.com/api-keys)

Optional environment variables for email:
- `RESEND_FROM_EMAIL` - Email address to send from (default: onboarding@resend.dev). Must be a verified domain in Resend for production use.
- `ADMIN_EMAIL` - Admin email address for notifications (default: admin@paradisecircus.com)

### Email Integration

The email system is fully integrated with Resend. To enable email sending:

1. **Get a Resend API Key**:
   - Sign up at https://resend.com
   - Go to API Keys section and create a new key
   - Copy your API key

2. **Set Environment Variables**:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=bookings@yourdomain.com  # Optional: Use your verified domain
   ADMIN_EMAIL=admin@yourdomain.com  # Optional: Where to send admin notifications
   ```

3. **Verify Your Domain** (for production):
   - In Resend dashboard, add and verify your domain
   - Update `RESEND_FROM_EMAIL` to use your verified domain email address

The system will automatically send:
- Booking confirmation emails to participants
- Admin notification emails when new bookings are created

## Application Routes

### Public Routes
- `/` - Workshop timetable (homepage)
- `/event/[slug]` - Individual event/workshop booking page
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
