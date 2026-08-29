"use client";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

export default function BookingsTable({ items, loading, busyId, onUpdateStatus, onDelete }) {
  if (!loading && items.length === 0) {
    return <p className="adm-empty">No booking requests here yet.</p>;
  }

  return (
    <div className="adm-table-wrap" aria-busy={loading}>
      <table className="adm-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Seat</th>
            <th>Message</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((booking) => {
            const busy = busyId === booking.id;

            return (
              <tr key={booking.id} className={busy ? "is-busy" : undefined}>
                <td className="adm-date">{formatDate(booking.createdAt)}</td>
                <td className="adm-name">{booking.name}</td>
                <td>
                  <a className="adm-phone" href={`tel:${booking.phone.replace(/\s+/g, "")}`}>
                    {booking.phone}
                  </a>
                </td>
                <td>
                  <span className="tag">{booking.platform}</span>
                </td>
                <td className="adm-message">{booking.message || <span className="adm-dim">—</span>}</td>
                <td>
                  <span className={`adm-pill is-${booking.status}`}>{booking.status}</span>
                </td>
                <td className="adm-actions">
                  {booking.status !== "confirmed" && (
                    <button
                      type="button"
                      className="adm-btn is-confirm"
                      onClick={() => onUpdateStatus(booking.id, "confirmed")}
                      disabled={busy}
                    >
                      Confirm
                    </button>
                  )}
                  {booking.status !== "cancelled" && (
                    <button
                      type="button"
                      className="adm-btn is-cancel"
                      onClick={() => onUpdateStatus(booking.id, "cancelled")}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  )}
                  {booking.status !== "pending" && (
                    <button
                      type="button"
                      className="adm-btn"
                      onClick={() => onUpdateStatus(booking.id, "pending")}
                      disabled={busy}
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    type="button"
                    className="adm-btn is-delete"
                    onClick={() => onDelete(booking.id, booking.name)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
