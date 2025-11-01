"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header
      style={{
        background: "linear-gradient(90deg,#0A0A0A 0%,#1A1A1A 100%)",
        borderBottom: "1px solid var(--accent-silver)",
        color: "var(--text-primary)",
      }}
      className="shadow-md"
    >
      <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 style={{ letterSpacing: "2px", fontWeight: 700 }}>
          <span style={{ color: "var(--text-primary)" }}>ROLE</span>
          <span style={{ color: "var(--accent-gold)" }}> OUT</span>
        </h1>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/feed" className="hover:text-gray-400">
            Feed
          </Link>

          {user && (
            <Link href="/upload" className="hover:text-gray-400">
              Upload
            </Link>
          )}

          {user ? (
            <button onClick={signOut} className="hover:text-gray-400">
              Sign Out
            </button>
          ) : (
            <Link href="/auth/signin" className="hover:text-gray-400">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
