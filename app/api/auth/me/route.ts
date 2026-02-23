import { getAuthContext } from "@/app/profile/actions";
import { corsJson, corsOptions } from "@/lib/cors";
import { authMeResponseSchema } from "@/lib/validations";

/**
 * Get current user auth context
 * @description Returns the current user's auth context (isAdmin, isInstructor, userId). Used for client-side navigation and timetable. Returns nulls when signed out.
 * @response authMeResponseSchema
 * @responseSet public
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
