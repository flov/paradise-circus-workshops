import { isAdmin } from "@/app/profile/actions";
import { NextResponse } from "next/server";

/**
 * Returns the current user's admin status for client-side navigation.
 * Only called when user is signed in - avoids blocking static rendering
 * of the layout for anonymous visitors.
 */
export async function GET() {
  const admin = await isAdmin();
  return NextResponse.json({ isAdmin: admin });
}
