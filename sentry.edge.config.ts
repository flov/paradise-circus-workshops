// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0a14604f73875051369c0e216bf357d0@o4510732963348480.ingest.de.sentry.io/4510732963807312",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  // Sample 100% in development, 10% in production to manage costs
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable Sentry in production
  enabled: process.env.NODE_ENV === "production",

  // Set environment
  environment: process.env.NODE_ENV || process.env.VERCEL_ENV || "development",

  // Filter out non-production errors as a safety net
  beforeSend(event, hint) {
    const env = process.env.NODE_ENV || process.env.VERCEL_ENV || "development";
    if (env !== "production") {
      return null; // Don't send events in non-production environments
    }
    return event;
  },

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
