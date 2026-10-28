import type { Metadata } from "next";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const grotesk = Schibsted_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-grotesk" });
const display = Newsreader({ subsets: ["latin"], display: "swap", variable: "--font-display", weight: ["500", "600"] });

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
