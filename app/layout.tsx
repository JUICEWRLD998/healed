import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

// Self-hosted (SIL OFL): Schibsted Grotesk and Newsreader, latin subset. next/font/google fails under Turbopack dev.
const grotesk = localFont({
  src: "./fonts/SchibstedGrotesk-latin.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-grotesk",
});
const display = localFont({
  src: "./fonts/Newsreader-latin.woff2",
  weight: "500 600",
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Healed",
  description: "See your brows healed before the needle. A permanent-makeup consult tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
