import { Anton } from "next/font/google";
import "./globals.css";

// Heavy condensed poster face for headings and the logo.
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const metadata = {
  title: "Venom Gaming — PS5 & PC Gaming Studio",
  description:
    "Venom Gaming is a premium gaming studio offering PlayStation 5 consoles and high-end gaming PCs by the hour. Book your seat, bring your squad.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
