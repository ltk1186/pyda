export function buildOwnedCreatorLookupFilter(userId: string) {
  return {
    owner_user_id: userId,
  };
}

export function assertSingleOwnedCreatorCount(count: number) {
  if (count > 1) {
    throw new Error("Multiple creator profiles are connected to this user.");
  }

  return count === 1;
}
