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

export const metadata: Metadata = {
  title: "Paradise Circus",
  description:
    "Book and manage your workshop sessions with ease at Paradise Circus.",
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
        <body className={`font-sans antialiased ${rye.variable}`}>
          <Navigation />
          <div className="pt-12">{children}</div>
          <Footer />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
