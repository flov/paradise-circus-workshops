# Paradise Circus - Flow Arts Community Platform

A full-stack social network and workshop booking platform for flow artists, built with Next.js 16. Connect with fellow artists, discover workshops, share your skills, and be part of the Paradise Circus community in Pai, Thailand.

### Social Network for Flow Artists

- 👤 **Artist Profiles**: Create and customize your profile with bio, photos, and social links
- 🎭 **Artist Directory**: Browse and discover flow artists in the Paradise Circus community
- 💬 **Event Comments**: Engage with the community by commenting on workshops and events
- 🎪 **Flow Props Tracking**: Showcase your flow props and skill levels (staff, poi, hoops, etc.)
- 📹 **Video Showcase**: Share your YouTube and Vimeo performance videos
- 🌐 **Social Integration**: Link your Instagram, Patreon, and personal website
- 🎨 **Performance Profiles**: Mark your availability for performances and share your performance style
- 📊 **Workshop History**: See how many workshops each instructor has taught

### Workshop Booking System

- 🎪 **Workshop Timetable**: Browse upcoming circus workshops with a vibrant, circus-themed design
- 📅 **Workshop Details**: View comprehensive information about each workshop including instructor, date, time, location, and capacity
- 🎫 **Online Booking**: Easy-to-use booking form with real-time capacity tracking
- ✅ **Booking Confirmation**: Beautiful confirmation page with all booking details

### Admin Dashboard

- 📊 **Statistics Dashboard**: View key metrics including total workshops, bookings, and capacity
- ✏️ **Workshop Management**: Create, edit, and delete workshops with an intuitive interface
- 👥 **Booking Management**: View all bookings and manage participant registrations
- 🔄 **Real-time Updates**: Automatic capacity tracking and data synchronization

### User Authentication & Profiles

- 🔐 **Secure Authentication**: Sign up and sign in powered by Clerk
- ✏️ **Profile Management**: Edit your profile, props, and social links
- 🎯 **Onboarding Flow**: Guided setup for new community members

### Email Notifications

- 📧 **Participant Confirmations**: Automated confirmation emails with workshop details
- 🔔 **Admin Notifications**: Receive notifications when new bookings are made
- 💬 **Comment Notifications**: Get notified when someone comments on events you're involved with
- 🎨 **Beautiful Templates**: Professional HTML email templates with circus branding

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Clerk for user authentication and profile management
- **Styling**: Tailwind CSS v4 with custom circus-themed color palette
- **UI Components**: shadcn/ui
- **Email**: Integrated with Resend for automated email notifications

## Database Schema

The application uses several main tables:

### Events/Workshops

- Workshop details (title, description, instructor)
- Scheduling (date, start time, end time, location)
- Capacity management (max capacity, current bookings)
- Prop associations and recurring series support

### Participations (Bookings)

- Participant information (name, email, phone)
- Event reference
- Participation status and notes
- Confirmation tokens

### Users

- User profiles (username, display name, bio)
- Social links (Instagram, Patreon, website)
- Video showcases (YouTube, Vimeo)
- Performance information (style, availability, location)
- Instructor and admin flags

### User Props

- Flow props associated with users
- Skill levels for each prop
- Links to the props catalog

### Comments

- Event comments with user attribution
- Author information and timestamps
- Threaded discussions on workshops

### Props

- Catalog of flow props (staff, poi, hoops, etc.)
- Used for event categorization and user profiles

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

Required environment variables for authentication:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key for authentication
- `CLERK_SECRET_KEY` - Clerk secret key for server-side operations

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

- `/` - Landing page with community overview
- `/timetable` - Workshop timetable (main booking interface)
- `/event/[slug]` - Individual event/workshop booking page with comments
- `/booking-confirmation/[id]` - Booking confirmation page
- `/artists` - Artist directory - browse all flow artists
- `/artists/[username]` - Individual artist profile page
- `/about` - About Paradise Circus
- `/faq` - Frequently asked questions

### User Routes

- `/sign-in` - User sign in
- `/sign-up` - User registration
- `/onboarding` - New user onboarding flow
- `/profile` - User's own profile page
- `/profile/edit` - Edit user profile

### Admin Routes

- `/admin` - Admin dashboard with statistics and management tools

### API Documentation

- `/api-docs` - Interactive API documentation (Scalar/OpenAPI). Documents all REST endpoints consumed by the mobile app and web.

Generate the OpenAPI spec with `pnpm openapi:generate` (also runs automatically before `pnpm build`).

## Design System

The application features a custom circus-themed design:

- **Primary Color**: Warm red-orange (circus tent inspired)
- **Secondary Color**: Golden yellow (spotlight inspired)
- **Background**: Warm cream tones
- **Typography**: Clean, readable fonts (Geist Sans)

## Key Features Explained

### Social Network Features

- **Artist Discovery**: Browse profiles by props, location, and performance availability
- **Community Engagement**: Comment on events to connect with other participants
- **Skill Showcase**: Display your flow props and skill levels to find practice partners
- **Performance Networking**: Mark availability for performances and connect with event organizers
- **Video Portfolio**: Share your best performances via YouTube and Vimeo integration

### Workshop Booking Features

- **Real-time Capacity Management**: Automatic tracking of available spots
- **Prevention of Overbooking**: System prevents booking beyond capacity
- **Visual Indicators**: Clear availability status on all workshop pages

### Technical Features

- **Responsive Design**: Mobile-first approach that adapts seamlessly to all screen sizes
- **Server Actions**: Secure server-side data mutations with automatic revalidation
- **Optimistic UI Updates**: Instant feedback for better user experience
- **Authentication Integration**: Seamless sign-in/sign-up with Clerk

## User Guide

### For Flow Artists

1. **Sign Up**: Create your account to join the Paradise Circus community
2. **Complete Profile**: Add your bio, props, skill levels, and social links
3. **Browse Artists**: Discover other flow artists and their specialties
4. **Book Workshops**: Sign up for workshops that match your interests
5. **Engage**: Comment on events and connect with the community

### Admin Dashboard Usage

1. **View Statistics**: See overview of workshops and bookings
2. **Add Workshop**: Click "Add Workshop" button to create a new workshop
3. **Edit Workshop**: Click the pencil icon next to any workshop to edit details
4. **Delete Workshop**: Click the trash icon to remove a workshop (also deletes associated bookings)
5. **Manage Bookings**: Switch to the "Bookings" tab to view and cancel bookings

## Production Considerations

Before deploying to production:

1. **Email Service**: Set up and configure your email service provider (Resend)
2. **Authentication**: Configure Clerk with production keys and domain settings
3. **Error Handling**: Implement comprehensive error logging and monitoring (Sentry integration available)
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Backup Strategy**: Set up automated database backups
6. **Environment Variables**: Ensure all production env vars are properly configured
7. **Content Moderation**: Consider moderation tools for user-generated content (comments, profiles)
8. **Image Upload**: Configure image storage for user avatars and profile photos

## Testing

Tests use Vitest and run against the database configured in `.env.test` (typically Neon cloud).

For faster test runs, use a local PostgreSQL instance:

```bash
pnpm test:db:up      # Start local Postgres (Docker)
pnpm test:db:migrate # Apply migrations
pnpm test:local      # Run tests (much faster than cloud)
pnpm test:db:down    # Stop container when done
```

## Support

For questions or issues, contact the Paradise Circus team.

---

Built with ❤️ for the Paradise Circus flow arts community 🎪

Connect, learn, and grow together in Pai, Thailand.
