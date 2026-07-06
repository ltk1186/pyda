import { createHash, randomBytes } from "node:crypto";

const claimTokenBytes = 32;
const claimTokenTtlDays = 14;

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
  now: Date;
}) {
  if (input.ownerUserId !== null || !input.claimExpiresAt) {
    return false;
  }

  return new Date(input.claimExpiresAt).getTime() > input.now.getTime();
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
