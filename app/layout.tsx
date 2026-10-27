import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healed",
  description: "See the healed result of permanent makeup before the needle touches skin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
