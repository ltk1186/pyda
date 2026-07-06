import { NextResponse, type NextRequest } from "next/server";
import {
  claimIntentClearCookieOptions,
  claimIntentCookieName,
} from "@/lib/claim/core";

export function GET(request: NextRequest) {
  const redirectUrl = new URL("/claim/resume", request.url);
  redirectUrl.searchParams.set("invalid", "1");
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(
    claimIntentCookieName,
    "",
    claimIntentClearCookieOptions(),
  );
  return response;
}
