export function isAdminProfile(profile: { is_admin: boolean } | null) {
  return profile?.is_admin === true;
}
