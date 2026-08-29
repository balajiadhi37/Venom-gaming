"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Shows which mail transport is live and, for Gmail, lets the admin connect
 * their Google account. SMTP has no interactive step — it is configured
 * entirely from the server's .env — so the panel only reports its state.
 */
export default function MailSettings({ apiFetch, onNotice, onError }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch("/api/mail/status");
      setStatus(data.data);
    } catch (err) {
      onError(err.message);
    }
  }, [apiFetch, onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The OAuth round trip lands back here as ?gmail=connected|error.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("gmail");
    if (!result) return;

    if (result === "connected") {
      onNotice(`Gmail connected as ${params.get("account") || "your account"}`);
    } else {
      onError(params.get("reason") || "Could not connect the Gmail account.");
    }

    // Strip the params so a refresh does not replay the message.
    window.history.replaceState({}, "", window.location.pathname);
    refresh();
  }, [refresh, onNotice, onError]);

  async function connect() {
    setBusy(true);
    try {
      const data = await apiFetch("/api/mail/gmail/connect");
      // Full navigation, not a popup: Google blocks its consent screen in
      // many popup/embedded contexts.
      window.location.href = data.data.url;
    } catch (err) {
      onError(err.message);
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect the Gmail account? You will not be able to email customers until you reconnect.")) {
      return;
    }

    setBusy(true);
    try {
      const data = await apiFetch("/api/mail/gmail/disconnect", { method: "POST" });
      onNotice(data.message);
      await refresh();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!status) return null;

  const isGmail = status.provider === "gmail";
  const ready = status.configured && status.connected;

  return (
    <section className="adm-mail">
      <div className="adm-mail-info">
        <span className={`adm-pill ${ready ? "is-confirmed" : "is-pending"}`}>
          {isGmail ? "Gmail" : "SMTP"}
        </span>
        <span className="adm-mail-text">
          {!status.configured && isGmail && "Gmail is not set up on the server — add the Google client credentials."}
          {!status.configured && !isGmail && "SMTP is not set up on the server — add the SMTP settings."}
          {status.configured && ready && <>Sending as <strong>{status.account}</strong></>}
          {status.configured && !ready && isGmail && "No account connected yet."}
        </span>
      </div>

      {isGmail && status.canConnect && (
        <div className="adm-mail-actions">
          {status.connected ? (
            <>
              <button className="btn btn-ghost" type="button" onClick={connect} disabled={busy}>
                Switch account
              </button>
              <button className="btn btn-ghost" type="button" onClick={disconnect} disabled={busy}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn btn-primary" type="button" onClick={connect} disabled={busy}>
              {busy ? "Opening Google..." : "Connect Gmail"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
