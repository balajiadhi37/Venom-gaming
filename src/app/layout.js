import { Anton } from "next/font/google";
import "./globals.css";
import PointerSpotlight from "./components/PointerSpotlight";

// Heavy condensed poster face for headings, the logo and buttons.
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const metadata = {
  title: "Venom Gaming Arena — PS5 & Sim Racing, Mylapore, Chennai",
  description:
    "Venom Gaming Arena in Mylapore, Chennai — PlayStation 5 consoles, gaming PCs and sim racing by the hour. Book your seat, bring your squad.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={display.variable}>
      <body>
        {children}
        <PointerSpotlight />
      </body>
    </html>
  );
}
