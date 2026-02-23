import { getAuthContext } from "@/app/profile/actions";
import { corsJson, corsOptions } from "@/lib/cors";

/**
 * Returns the current user's auth context for client-side navigation and timetable.
 * Only called when user is signed in - avoids blocking static rendering
 * of the layout for anonymous visitors.
 */
export async function GET() {
  const context = await getAuthContext();
  if (!context) {
    return corsJson({ isAdmin: false, isInstructor: false, userId: null });
  }
  return corsJson({
    isAdmin: context.isAdmin,
    isInstructor: context.isInstructor,
    userId: context.userId,
  });
}

export async function OPTIONS() {
  return corsOptions();
}
