import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";

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
      <body className="pb-safe">
        <AuthProvider>
          <Header />
          <div className="mb-20 md:mb-0">
            {children}
          </div>
          <MobileTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
