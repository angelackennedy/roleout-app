import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RollCall - Video Social Platform",
  description: "Share and discover short videos with transparent moderation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
