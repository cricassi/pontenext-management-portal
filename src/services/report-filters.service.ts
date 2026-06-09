import {
  EMAIL_CAMPAIGN_AUDIENCE_TYPE,
  EMAIL_CAMPAIGN_STATUS,
} from "@/types/email";
import { EVENT_STATUS } from "@/types/event";
import { MEMBER_STATUS } from "@/types/member";
import { MEMBERSHIP_STATUS } from "@/types/membership";
import { PAYMENT_METHOD, PAYMENT_STATUS } from "@/types/payment";
import {
  REPORT_EXPIRATION_WINDOW,
  REPORT_EXPORT_FORMAT,
  REPORT_TYPE,
  type ReportExportFormat,
  type ReportExportRequest,
  type ReportExpirationWindow,
  type ReportFilters,
  type ReportType,
} from "@/types/report";
import {
  SPONSOR_CONTRIBUTION_TYPE,
  SPONSOR_STATUS,
} from "@/types/sponsor";

type RawReportInput = {
  get(name: string): FormDataEntryValue | string | string[] | null | undefined;
};

function firstValue(value: FormDataEntryValue | string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

function readString(input: RawReportInput, key: string) {
  const value = firstValue(input.get(key));
  return value?.trim() || undefined;
}

function isValueInObject<T extends Record<string, string>>(
  value: string | undefined,
  object: T,
): value is T[keyof T] {
  return value ? Object.values(object).includes(value) : false;
}

function readReportType(value: string | undefined): ReportType {
  return isValueInObject(value, REPORT_TYPE) ? value : REPORT_TYPE.MEMBERS;
}

function readReportExportFormat(value: string | undefined): ReportExportFormat {
  return isValueInObject(value, REPORT_EXPORT_FORMAT)
    ? value
    : REPORT_EXPORT_FORMAT.CSV;
}

function readExpirationWindow(
  value: string | undefined,
): ReportExpirationWindow {
  return isValueInObject(value, REPORT_EXPIRATION_WINDOW)
    ? value
    : REPORT_EXPIRATION_WINDOW.EXPIRED;
}

function readDate(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function readBoolean(value: string | undefined) {
  return value === "on" || value === "true" || value === "1";
}

function readStatus(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  if (
    isValueInObject(value, MEMBER_STATUS) ||
    isValueInObject(value, MEMBERSHIP_STATUS) ||
    isValueInObject(value, SPONSOR_STATUS) ||
    isValueInObject(value, EVENT_STATUS) ||
    isValueInObject(value, EMAIL_CAMPAIGN_STATUS)
  ) {
    return value;
  }

  return "all";
}

function readMembershipStatus(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  if (value === "without_membership") {
    return value;
  }

  return isValueInObject(value, MEMBERSHIP_STATUS) ? value : "all";
}

function readPaymentStatus(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return isValueInObject(value, PAYMENT_STATUS) ? value : "all";
}

function readPaymentMethod(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return isValueInObject(value, PAYMENT_METHOD) ? value : "all";
}

function readContributionType(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return isValueInObject(value, SPONSOR_CONTRIBUTION_TYPE) ? value : "all";
}

function readAudienceType(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return isValueInObject(value, EMAIL_CAMPAIGN_AUDIENCE_TYPE) ? value : "all";
}

export function readReportFilters(input: RawReportInput): ReportFilters {
  const reportType = readReportType(readString(input, "reportType"));
  const dateFrom = readDate(readString(input, "dateFrom"));
  const dateTo = readDate(readString(input, "dateTo"));

  return {
    reportType,
    query: readString(input, "q"),
    status: readStatus(readString(input, "status")),
    membershipStatus: readMembershipStatus(readString(input, "membershipStatus")),
    paymentStatus: readPaymentStatus(readString(input, "paymentStatus")),
    paymentMethod: readPaymentMethod(readString(input, "paymentMethod")),
    contributionType: readContributionType(readString(input, "contributionType")),
    audienceType: readAudienceType(readString(input, "audienceType")),
    expirationWindow: readExpirationWindow(readString(input, "expirationWindow")),
    dateFrom,
    dateTo: dateFrom && dateTo && dateTo < dateFrom ? dateFrom : dateTo,
    includeArchived: readBoolean(readString(input, "includeArchived")),
  };
}

export function readReportFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  return readReportFilters({
    get(name) {
      return params[name];
    },
  });
}

export function readReportExportRequestFromFormData(
  formData: FormData,
): ReportExportRequest {
  return {
    filters: readReportFilters(formData),
    format: readReportExportFormat(readString(formData, "format")),
  };
}
