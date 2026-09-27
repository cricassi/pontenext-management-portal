import type { MembershipPlan } from "@/types/membership";

export function addInitialMembershipMonths(value: string, months: number) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function getInitialMembershipDefaults(
  plans: MembershipPlan[],
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  const startDate = `${part("year")}-${part("month")}-${part("day")}`;
  const plan = plans.find(
    (item) => item.isActive && !item.archivedAt && item.defaultDurationMonths === 12,
  );

  return {
    membershipPlanId: plan?.id,
    startDate,
    endDate: addInitialMembershipMonths(startDate, 12),
    minimumFee: plan?.minimumFee ?? 0,
    expectedFee: plan?.minimumFee ?? 0,
  };
}
