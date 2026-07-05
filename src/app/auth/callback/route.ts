import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    return redirectToLogin(requestUrl, nextPath, "oauth");
  }

  if (!code) {
    return redirectToLogin(requestUrl, nextPath, "missing_code");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLogin(requestUrl, nextPath, "exchange");
    }

    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  } catch {
    return redirectToLogin(requestUrl, nextPath, "config");
  }
}

function redirectToLogin(url: URL, nextPath: string, error: string) {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}
