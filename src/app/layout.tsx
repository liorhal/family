import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { debugLog } from "@/lib/debug-log";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Family Dashboard",
    template: "%s",
  },
  description: "Gamified productivity for families",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // #region agent log
  debugLog("layout.tsx", "root_layout_render", { hypothesisId: "H0" });
  // #endregion
  return (
    <html lang="en" className={lexend.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
