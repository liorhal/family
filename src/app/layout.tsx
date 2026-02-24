import type { Metadata } from "next";
import "./globals.css";
import { debugLog } from "@/lib/debug-log";

export const metadata: Metadata = {
  title: "Family Productivity",
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
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
