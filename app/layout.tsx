import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const grotesk = Schibsted_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "Healed",
  description: "See your brows healed before the needle. A permanent-makeup consult tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
