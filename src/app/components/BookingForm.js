"use client";

import { useState } from "react";

const EMPTY = { name: "", phone: "", platform: "PS5", message: "" };

export default function BookingForm() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSent(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    // No backend yet — swap this for an API route or WhatsApp link when you are ready.
    setSent(true);
    setForm(EMPTY);
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
      <input
        type="tel"
        placeholder="Phone number"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
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
      <button className="btn btn-primary" type="submit">
        Request booking
      </button>
      {sent && <p className="form-note">Thanks! We will call you back to confirm your slot.</p>}
    </form>
  );
}
