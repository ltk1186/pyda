import { createHash, randomBytes } from "node:crypto";

const claimTokenBytes = 32;
const claimTokenTtlDays = 14;
export const claimIntentCookieName = "pyda_claim_intent";
export const claimIntentMaxAgeSeconds = 15 * 60;
export const claimResumePath = "/claim/resume";

export function generateClaimToken() {
  return randomBytes(claimTokenBytes).toString("base64url");
}

export function hashClaimToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function claimExpiresAt(createdAt: Date) {
  const expiresAt = new Date(createdAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + claimTokenTtlDays);
  return expiresAt;
}

export function isClaimLinkUsable(input: {
  claimExpiresAt: string | null;
  ownerUserId: string | null;
  status: string;
  now: Date;
}) {
  if (
    input.status === "archived" ||
    input.ownerUserId !== null ||
    !input.claimExpiresAt
  ) {
    return false;
  }

  return new Date(input.claimExpiresAt).getTime() > input.now.getTime();
}

export function canGenerateClaimLink(input: {
  ownerUserId: string | null;
  status: string;
}) {
  return input.ownerUserId === null && input.status !== "archived";
}

export function canUserClaimCreator(input: { connectedCreatorCount: number }) {
  return input.connectedCreatorCount === 0;
}

export function getClaimLoginNextPath() {
  return claimResumePath;
}

export function buildClaimUpdateMatch(input: {
  creatorId: string;
  tokenHash: string;
}) {
  return {
    id: input.creatorId,
    owner_user_id: null,
    claim_token_hash: input.tokenHash,
  };
}

export function buildClaimSuccessPayload(input: {
  nowIso: string;
  userId: string;
}) {
  return {
    owner_user_id: input.userId,
    claimed_at: input.nowIso,
    claim_token_hash: null,
    claim_expires_at: null,
  };
}

export function claimIntentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: claimIntentMaxAgeSeconds,
  };
}

export function claimIntentClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
