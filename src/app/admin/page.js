import AdminDashboard from "./AdminDashboard";
import "./admin.css";

export const metadata = {
  title: "Bookings — Venom Gaming Admin",
  // The panel is behind a shared secret; keep it out of search results anyway.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
