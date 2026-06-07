export function buildMembershipRenewalHref(
  memberId: string,
  sourceMembershipId?: string,
) {
  const params = new URLSearchParams({ memberId });

  if (sourceMembershipId) {
    params.set("renewFrom", sourceMembershipId);
    params.set("mode", "quick");
  }

  return `/memberships/new?${params.toString()}`;
}
