import "server-only";

import { cookies } from "next/headers";
import {
  claimIntentClearCookieOptions,
  claimIntentCookieName,
  claimIntentCookieOptions,
} from "./core";

export async function setClaimIntentCookie(rawToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(claimIntentCookieName, rawToken, claimIntentCookieOptions());
}

export async function getClaimIntentToken() {
  const cookieStore = await cookies();
  return cookieStore.get(claimIntentCookieName)?.value ?? null;
}

export async function clearClaimIntentCookie() {
  const cookieStore = await cookies();
  cookieStore.set(claimIntentCookieName, "", claimIntentClearCookieOptions());
}
