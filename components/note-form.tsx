"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client-api";

export function NoteForm({ reference }: { reference: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (body.trim().length === 0) {
      setError("Write a note before saving.");
      return;
    }

    setSubmitting(true);
    const response = await sendJson<{ ok: boolean }>(
      `/api/requests/${encodeURIComponent(reference)}/notes`,
      "POST",
      { body },
    );
    setSubmitting(false);

    if (!response.ok) {
      setError(response.fieldErrors.body ?? response.message);
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label htmlFor="note" className="label">
        Add an internal note
      </label>
      <textarea
        id="note"
        className="textarea"
        rows={3}
        maxLength={500}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Access details, parts ordered, a callback time — anything the office needs."
        aria-invalid={Boolean(error)}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[0.7rem] text-muted">
          Internal only · {body.length}/500
        </p>
        <button type="submit" className="btn btn-outline btn-sm" disabled={submitting}>
          {submitting ? "Saving…" : "Save note"}
        </button>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </form>
  );
}
