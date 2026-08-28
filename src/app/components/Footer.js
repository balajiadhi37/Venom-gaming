import { STUDIO } from "../data1";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>
          © {new Date().getFullYear()} {STUDIO.name}. All rights reserved.
        </span>
        <span>
          {STUDIO.instagram} · {STUDIO.phone}
        </span>
      </div>
    </footer>
  );
}
