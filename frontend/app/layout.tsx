import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Buddy System",
  description: "Study partner matching, scheduling, and profile preferences."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
