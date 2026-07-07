import "server-only";

import { getOwnedCreatorForUser } from "@/lib/creator/owner";
import { getAdvertiserRequests } from "@/lib/requests/data";
import { getAccountProfile } from "./profile";

export async function getAccountOverview(userId: string) {
  const [profile, requests, creator] = await Promise.all([
    getAccountProfile(userId),
    getAdvertiserRequests(userId),
    getOwnedCreatorForUser(userId),
  ]);

  return {
    profile,
    requests,
    creator,
  };
}
