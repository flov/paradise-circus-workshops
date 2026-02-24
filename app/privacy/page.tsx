import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | Privacy Policy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: February 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Paradise Circus (&quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;) operates the Paradise Circus website and mobile
              app (the &quot;Service&quot;). This policy explains what
              information we collect, how we use it, and your rights regarding
              it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Account information
              </h3>
              <p>
                When you create an account, we collect your name, email address,
                and any profile information you choose to provide (bio, Instagram
                handle, props/skills, profile photo).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Workshop bookings
              </h3>
              <p>
                When you book a workshop, we collect your name, email address,
                and optional phone number and notes to facilitate your booking.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Usage data
              </h3>
              <p>
                We collect standard server logs (IP address, browser type,
                pages visited) for security and performance monitoring via
                Sentry.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>To manage your account and bookings</li>
              <li>
                To send booking confirmations and event-related emails
              </li>
              <li>To display your public artist profile (if you create one)</li>
              <li>To improve the Service and fix issues</li>
            </ul>
            <p>
              We do not sell your personal information to third parties. We do
              not use your data for advertising.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="font-medium text-foreground">Clerk</span> —
                authentication and account management
              </li>
              <li>
                <span className="font-medium text-foreground">Neon</span> —
                database hosting (PostgreSQL, hosted in AWS)
              </li>
              <li>
                <span className="font-medium text-foreground">Resend</span> —
                transactional email delivery
              </li>
              <li>
                <span className="font-medium text-foreground">Vercel</span> —
                website hosting
              </li>
              <li>
                <span className="font-medium text-foreground">Sentry</span> —
                error tracking
              </li>
            </ul>
            <p>
              Each provider has its own privacy policy. We only share the
              minimum data necessary for each service to function.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Data Retention & Deletion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              We retain your account data for as long as your account is active.
              Booking records are kept for operational and historical purposes.
            </p>
            <p>
              To delete your data, simply delete your account via the profile
              menu in Clerk (click your avatar, then &quot;Manage account&quot;).
              Deleting your account will remove your profile and associated data
              from our systems.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data via your profile settings</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time by deleting your account</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:contact@paradise-circus.app"
                className="text-primary hover:underline"
              >
                contact@paradise-circus.app
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Paradise Circus, Pai, Mae Hong Son, Thailand
              <br />
              Email:{" "}
              <a
                href="mailto:contact@paradise-circus.app"
                className="text-primary hover:underline"
              >
                contact@paradise-circus.app
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
