import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rye } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { Navigation } from "@/components/navigation";
import "./globals.css";
import { Footer } from "@/components/footer";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const rye = Rye({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rye",
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://paradise-circus.app";

export const metadata: Metadata = {
  title: {
    default: "Paradise Circus",
    template: "%s | Paradise Circus",
  },
  description:
    "Connect with fellow artists, discover workshops, share your skills, and be part of the Paradise Circus community in Pai, Thailand.",

  keywords: [
    "Paradise Circus",
    "Pai Thailand",
    "circus workshops",
    "flow arts",
    "circus training",
    "flow artists",
    "workshops",
    "circus community",
    "Thailand circus",
  ],
  authors: [{ name: "Paradise Circus" }],
  creator: "Paradise Circus",
  publisher: "Paradise Circus",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Paradise Circus",
    title: "Paradise Circus - A Circus Community in Pai, Thailand",
    description:
      "Discover Paradise Circus in Pai, Thailand. Explore our talented artists, view our up-to-date timetable, and join our workshops.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Paradise Circus Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paradise Circus - Circus Workshops in Pai, Thailand",
    description:
      "Discover Paradise Circus in Pai, Thailand. Explore our talented artists, view our up-to-date timetable, and join our workshops.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          formFieldInput: "border-input bg-background",
          card: "bg-card border-border",
        },
        layout: {
          socialButtonsPlacement: "top",
        },
        variables: {
          colorPrimary: "hsl(var(--primary))",
        },
      }}
    >
      <html lang="en">
        <body
          className={`font-sans antialiased ${rye.variable} min-h-screen flex flex-col`}
        >
          <Navigation />
          <div className="pt-12 flex-1">{children}</div>
          <Footer />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
