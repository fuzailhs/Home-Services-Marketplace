import { z } from "zod";
import { todayIso } from "@/lib/today";
import { CATEGORIES, STATUSES } from "@/lib/types";
import { normaliseReference } from "@/lib/reference-format";

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

const futureDate = dateOnly.refine((value) => value >= todayIso(), {
  message: "Choose today or a later date.",
});

export const requestInputSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Use 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "Enter your email address.")
    .max(160, "Use 160 characters or fewer.")
    .email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a phone number we can reach you on.")
    .max(40, "Use 40 characters or fewer.")
    .regex(/^[0-9+()\s-]+$/, "Use digits, spaces and + ( ) - only."),
  serviceArea: z
    .string()
    .trim()
    .min(2, "Enter the area or postcode.")
    .max(80, "Use 80 characters or fewer."),
  category: z.enum(CATEGORIES, { message: "Choose a service category." }),
  preferredDate: futureDate,
  description: z
    .string()
    .trim()
    .min(20, "Describe the job in at least 20 characters.")
    .max(500, "Keep the description to 500 characters or fewer."),
});

export type RequestInput = z.infer<typeof requestInputSchema>;

export const lookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(1, "Enter your reference number.")
    .transform(normaliseReference)
    .refine((value) => /^HSM-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(value), {
      message: "References look like HSM-ABCD-2345.",
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "Enter the email address used on the request.")
    .email("Enter a valid email address."),
});

export const assignSchema = z.object({
  providerId: z.string().uuid("Choose a provider."),
  scheduledDate: futureDate,
  expectedStatus: z.enum(STATUSES),
});

export const statusUpdateSchema = z.object({
  status: z.enum(STATUSES),
  expectedStatus: z.enum(STATUSES),
  note: z
    .string()
    .trim()
    .max(500, "Keep the note to 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const noteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a note before saving.")
    .max(500, "Keep the note to 500 characters or fewer."),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email.").email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const queueFilterSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  view: z.enum(["open", "all"]).optional(),
  sort: z.enum(["newest", "preferred"]).optional(),
});

export type FieldErrors = Record<string, string>;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors; message: string };

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function parseInput<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): ParseResult<z.infer<T>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    fieldErrors: toFieldErrors(result.error),
    message: "Check the highlighted fields and try again.",
  };
}

/** Turns FormData into a plain object without trusting any key. */
export function formValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  return values;
}
