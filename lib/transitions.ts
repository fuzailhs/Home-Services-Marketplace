import type { Role, Status } from "@/lib/types";

/**
 * Business rules from the brief. A provider can only move a job forward one
 * step at a time; an administrator can assign work and cancel a request that
 * has not started. Nothing else is allowed.
 */
const PROVIDER_TRANSITIONS: Partial<Record<Status, Status[]>> = {
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

const ADMIN_TRANSITIONS: Partial<Record<Status, Status[]>> = {
  NEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["CANCELLED"],
};

export function nextStatusesFor(status: Status, role: Role): Status[] {
  if (role === "PROVIDER") return PROVIDER_TRANSITIONS[status] ?? [];
  return [...(ADMIN_TRANSITIONS[status] ?? []), ...(PROVIDER_TRANSITIONS[status] ?? [])];
}

export function canTransition(from: Status, to: Status, role: Role): boolean {
  return nextStatusesFor(from, role).includes(to);
}

/** Customer-safe wording written into the timeline for each status change. */
export const PUBLIC_STATUS_TEXT: Record<Status, string> = {
  NEW: "Request received. Our office will review it and confirm the visit.",
  ASSIGNED:
    "A provider has been assigned to your request. The office will confirm the appointment.",
  IN_PROGRESS: "Your provider has started work on the request.",
  COMPLETED: "The work is complete.",
  CANCELLED: "This request has been cancelled by the office.",
};

export const AUDIT_ACTIONS = {
  REQUEST_CREATED: "request.created",
  PROVIDER_ASSIGNED: "request.provider_assigned",
  STATUS_CHANGED: "request.status_changed",
  NOTE_ADDED: "request.note_added",
  REQUEST_CANCELLED: "request.cancelled",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
