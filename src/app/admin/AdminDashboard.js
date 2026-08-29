"use client";

import { useCallback, useEffect, useState } from "react";

import BookingsTable from "./BookingsTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// The key only ever lives in this tab's memory — never in the bundle or a cookie.
const KEY_STORAGE = "venom-admin-key";
const PAGE_SIZE = 20;

const STATUSES = ["pending", "confirmed", "cancelled"];
const FILTERS = [{ value: "all", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s }))];

/** Calls the API with the admin header and unwraps the {success, data} envelope. */
async function apiFetch(path, adminKey, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey, ...options.headers },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.errors?.[0] || data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return data;
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [restored, setRestored] = useState(false);

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [counts, setCounts] = useState(null);

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  // Pick the key back up on a reload so a refresh does not log you out.
  useEffect(() => {
    setAdminKey(sessionStorage.getItem(KEY_STORAGE) || "");
    setRestored(true);
  }, []);

  const signOut = useCallback((message = "") => {
    sessionStorage.removeItem(KEY_STORAGE);
    setAdminKey("");
    setItems([]);
    setCounts(null);
    setError(message);
  }, []);

  const load = useCallback(async () => {
    if (!adminKey) return;

    setLoading(true);
    setError("");

    const query = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
    if (filter !== "all") query.set("status", filter);

    try {
      // One page of bookings plus a cheap count per status for the tiles.
      const [list, ...totals] = await Promise.all([
        apiFetch(`/api/bookings?${query}`, adminKey),
        ...STATUSES.map((status) => apiFetch(`/api/bookings?status=${status}&limit=1`, adminKey)),
      ]);

      setItems(list.data || []);
      setMeta(list.meta || { total: 0, page: 1, pages: 1 });
      setCounts(
        STATUSES.reduce(
          (acc, status, i) => {
            const value = totals[i].meta?.total || 0;
            acc[status] = value;
            acc.total += value;
            return acc;
          },
          { total: 0 }
        )
      );
    } catch (err) {
      if (err.status === 401) {
        signOut("That admin key was rejected. Please sign in again.");
      } else {
        setError(err.message || "Could not reach the API.");
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter, page, signOut]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSignIn(event) {
    event.preventDefault();
    const key = new FormData(event.currentTarget).get("adminKey")?.toString().trim();

    if (!key) {
      setError("Enter the admin key.");
      return;
    }

    sessionStorage.setItem(KEY_STORAGE, key);
    setAdminKey(key);
    setPage(1);
    setError("");
  }

  function changeFilter(value) {
    setFilter(value);
    setPage(1);
  }

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      await apiFetch(`/api/bookings/${id}/status`, adminKey, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function remove(id, name) {
    if (!window.confirm(`Delete the booking from ${name}? This cannot be undone.`)) return;

    setBusyId(id);
    try {
      await apiFetch(`/api/bookings/${id}`, adminKey, { method: "DELETE" });
      // Stepping back keeps you off an empty last page.
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  if (!restored) return null;

  if (!adminKey) {
    return (
      <main className="adm-gate">
        <form className="adm-gate-card form" onSubmit={handleSignIn}>
          <h1>
            Venom <span className="accent">Admin</span>
          </h1>
          <p className="adm-gate-note">
            Enter the admin key (the <code>ADMIN_KEY</code> from the API .env) to see the booking
            requests.
          </p>
          <input type="password" name="adminKey" placeholder="Admin key" autoFocus required />
          <button className="btn btn-primary" type="submit">
            Unlock
          </button>
          {error && <p className="adm-error">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="adm">
      <header className="adm-top">
        <div>
          <h1>
            Booking <span className="accent">Requests</span>
          </h1>
          <p className="adm-sub">Everything submitted through the site&apos;s booking form.</p>
        </div>
        <div className="adm-top-actions">
          <button className="btn btn-ghost" type="button" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => signOut()}>
            Lock
          </button>
        </div>
      </header>

      <section className="adm-stats">
        <div className="adm-stat">
          <strong>{counts ? counts.total : "—"}</strong>
          <span>Total</span>
        </div>
        {STATUSES.map((status) => (
          <div className={`adm-stat is-${status}`} key={status}>
            <strong>{counts ? counts[status] : "—"}</strong>
            <span>{status}</span>
          </div>
        ))}
      </section>

      <div className="adm-filters">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`filter-btn${filter === option.value ? " active" : ""}`}
            onClick={() => changeFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="adm-error">{error}</p>}

      <BookingsTable
        items={items}
        loading={loading}
        busyId={busyId}
        onUpdateStatus={updateStatus}
        onDelete={remove}
      />

      {meta.pages > 1 && (
        <nav className="adm-pager">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span>
            Page {meta.page} of {meta.pages} · {meta.total} total
          </span>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, meta.pages))}
            disabled={page >= meta.pages || loading}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
