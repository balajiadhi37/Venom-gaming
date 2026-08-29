"use client";

import { useEffect, useRef, useState } from "react";

const STATUS_LINE = {
  pending: "We have received your request and will confirm shortly.",
  confirmed: "Your slot is confirmed. See you at the arena!",
  cancelled: "Unfortunately that slot is not available.",
};

/** Prefill the compose box from the booking, so most sends are one click. */
function draftFor(booking) {
  const slot = booking.message?.trim() || "not specified";

  return {
    subject: `Your Venom Gaming Arena booking (${booking.platform})`,
    body: [
      `Hi ${booking.name},`,
      "",
      STATUS_LINE[booking.status] || "",
      "",
      `Seat: ${booking.platform}`,
      `Slot you asked for: ${slot}`,
      `Status: ${booking.status}`,
      "",
      "Venom Gaming Arena, Mylapore, Chennai",
    ].join("\n"),
  };
}

export default function EmailDialog({ booking, onClose, onSend }) {
  const [draft, setDraft] = useState(() => draftFor(booking));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const subjectRef = useRef(null);

  useEffect(() => {
    subjectRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, sending]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      await onSend(booking, draft);
      onClose();
    } catch (err) {
      setError(err.message || "Could not send the email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="adm-modal" onClick={() => !sending && onClose()}>
      <form
        className="adm-modal-panel"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>
          Email <span className="accent">{booking.name}</span>
        </h2>
        <p className="adm-modal-to">{booking.email}</p>

        <label className="adm-field">
          <span>Subject</span>
          <input
            ref={subjectRef}
            type="text"
            value={draft.subject}
            maxLength={150}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            required
          />
        </label>

        <label className="adm-field">
          <span>Message</span>
          <textarea
            rows={12}
            value={draft.body}
            maxLength={5000}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            required
          />
        </label>

        {error && <p className="adm-error">{error}</p>}

        <div className="adm-modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send email"}
          </button>
        </div>
      </form>
    </div>
  );
}
