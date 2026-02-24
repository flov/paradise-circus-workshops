import { NextRequest, NextResponse } from "next/server";
import { cancelParticipation } from "@/app/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const participationIdParam = searchParams.get("id");

  if (!participationIdParam) {
    return NextResponse.redirect(
      new URL("/?error=missing_participation_id", request.url)
    );
  }

  const participationId = parseInt(participationIdParam);
  if (isNaN(participationId)) {
    return NextResponse.redirect(
      new URL("/?error=invalid_participation_id", request.url)
    );
  }

  const result = await cancelParticipation(participationId);

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

