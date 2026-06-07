import type { SponsorContributionType } from "@/types/sponsor";

export const EVENT_STATUS = {
  PLANNED: "planned",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export type Event = {
  id: string;
  name: string;
  description: string | null;
  startDatetime: string;
  endDatetime: string | null;
  location: string | null;
  status: EventStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type EventFormValues = {
  name: string;
  description: string | null;
  startDatetime: string;
  endDatetime: string | null;
  location: string | null;
  status: EventStatus;
  notes: string | null;
};

export type EventListItem = Event & {
  sponsorCount: number;
  contributionCount: number;
  totalMoneyAmount: number;
};

export type EventFilters = {
  query?: string;
  status?: EventStatus | "all";
};

export type EventSponsor = {
  id: string;
  eventId: string;
  sponsorId: string;
  sponsorCompanyName: string;
  sponsorshipLevel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type EventSponsorFormValues = {
  sponsorId: string;
  sponsorshipLevel: string | null;
  notes: string | null;
};

export type EventSponsorOption = {
  id: string;
  companyName: string;
};

export type EventContribution = {
  id: string;
  eventId: string;
  sponsorId: string;
  sponsorCompanyName: string;
  contributionDate: string;
  amount: number;
  contributionType: SponsorContributionType;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type SponsorLinkedEventOption = {
  id: string;
  name: string;
  startDatetime: string;
};
