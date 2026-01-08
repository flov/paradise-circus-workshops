import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/app/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingIdParam = searchParams.get("id");

  if (!bookingIdParam) {
    return NextResponse.redirect(
      new URL("/?error=missing_booking_id", request.url)
    );
  }

  const bookingId = parseInt(bookingIdParam);
  if (isNaN(bookingId)) {
    return NextResponse.redirect(
      new URL("/?error=invalid_booking_id", request.url)
    );
  }

  const result = await cancelBooking(bookingId);

  if (result.success) {
    return NextResponse.redirect(
      new URL("/?cancelled=true", request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(result.error || "failed_to_cancel")}`, request.url)
    );
  }
}

