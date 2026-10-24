export const CATEGORIES = ["PLUMBING", "ELECTRICAL", "CLEANING"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  CLEANING: "Cleaning",
};

export const CATEGORY_BLURBS: Record<Category, string> = {
  PLUMBING: "Leaks, blocked drains, taps, toilets and water pressure.",
  ELECTRICAL: "Sockets, lighting, tripping breakers and faulty fittings.",
  CLEANING: "Deep cleans, end-of-tenancy cleans and one-off visits.",
};

export const STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Plain-language status text shown to the customer. */
export const STATUS_CUSTOMER_TEXT: Record<Status, string> = {
  NEW: "We have your request and it is waiting to be reviewed.",
  ASSIGNED:
    "A provider has been assigned and the visit is being scheduled.",
  IN_PROGRESS: "The provider has started work on your request.",
  COMPLETED: "The work is complete. Thank you for using the service.",
  CANCELLED: "This request was cancelled. Contact the office if that is unexpected.",
};

export const OPEN_STATUSES: Status[] = ["NEW", "ASSIGNED", "IN_PROGRESS"];

export type Role = "ADMIN" | "PROVIDER";

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}
