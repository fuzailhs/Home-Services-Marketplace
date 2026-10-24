import { APP_TIME_ZONE } from "@/lib/today";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

/** Calendar dates are stored as YYYY-MM-DD and must not shift with a time zone. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const iso = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return `${dateTimeFormatter.format(date)} (${APP_TIME_ZONE.replace("_", " ")})`;
}

export function formatDateTimeShort(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return dateTimeFormatter.format(date);
}

export function humanise(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
