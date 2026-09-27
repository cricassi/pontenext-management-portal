export function buildInitialMembershipHref(memberId: string) {
  return `/memberships/new?${new URLSearchParams({ memberId, mode: "initial" })}`;
}

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
