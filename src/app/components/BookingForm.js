"use client";

import { useState } from "react";

const EMPTY = { name: "", phone: "", platform: "PS5", message: "" };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BookingForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [note, setNote] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status !== "sending") {
      setStatus("idle");
      setNote("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("sending");
    setNote("");

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.errors?.[0] || data.message || "Could not send your request.");
      }

      setForm(EMPTY);
      setStatus("sent");
      setNote(data.message || "Thanks! We will call you back to confirm your slot.");
    } catch (err) {
      setStatus("error");
      setNote(err.message || "Could not reach the server. Please call us instead.");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      {/* The onChange strip is the 10-digit cap. Do not add maxLength: it counts
          characters, so pasting "98765 43210" would lose a digit before we see it. */}
      <input
        type="tel"
        inputMode="numeric"
        placeholder="Phone number"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
        pattern="[0-9]{10}"
        required
      />
      <select value={form.platform} onChange={(e) => update("platform", e.target.value)}>
        <option value="PS5">PS5 seat</option>
        <option value="PC">Gaming PC seat</option>
        <option value="Squad">Squad pack (4 seats)</option>
        <option value="Event">Tournament / private event</option>
      </select>
      <textarea
        placeholder="Preferred date, time and number of players"
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Request booking"}
      </button>
      {note && <p className="form-note">{note}</p>}
    </form>
  );
}
