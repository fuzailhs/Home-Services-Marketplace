"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client-api";
import { signInSchema, toFieldErrors, type FieldErrors } from "@/lib/validation";

interface SignInPayload {
  ok: boolean;
  user: { fullName: string; role: "ADMIN" | "PROVIDER" };
  redirectTo: string;
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    const response = await sendJson<SignInPayload>("/api/auth/sign-in", "POST", parsed.data);
    setSubmitting(false);

    if (!response.ok) {
      setErrors(response.fieldErrors);
      setFormError(response.message);
      return;
    }

    router.replace(response.data.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card card-shadow p-6 sm:p-8">
      <h2 className="text-2xl">Sign in</h2>
      <p className="mt-1.5 text-sm text-muted">
        For the office team and assigned providers.
      </p>

      {formError && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-[#e6b8a9] bg-[#fdf0ea] px-4 py-3 text-sm font-medium text-[#8c3520]"
        >
          {formError}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="label">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="input"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError("email");
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="error-text" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError("password");
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="error-text" role="alert">
              {errors.password}
            </p>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-7 w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Sessions expire after the configured idle period. Customer accounts do not
        exist in this release.
      </p>
    </form>
  );
}
