"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotificationCount } from "@/lib/hooks/useNotificationCount";

export default function Header() {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotificationCount(user?.id || null);

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
          <Link href="/" className="hover:text-gray-400">
            For You
          </Link>

          {user && (
            <>
              <Link href="/mall" className="hover:text-gray-400">
                🛍️ Mall
              </Link>
              <Link href="/following" className="hover:text-gray-400">
                Following
              </Link>
              <Link href="/discover" className="hover:text-gray-400">
                Discover
              </Link>
              <Link href="/trending" className="hover:text-gray-400">
                Trending
              </Link>
              <Link href="/search" className="hover:text-gray-400">
                Search
              </Link>
              <Link href="/inbox" className="hover:text-gray-400">
                Messages
              </Link>
              <Link 
                href="/notifications" 
                className="hover:text-gray-400"
                style={{ position: 'relative', display: 'inline-block' }}
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    background: '#ff4444',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/upload" className="hover:text-gray-400">
                Upload
              </Link>
              <Link href="/editor" className="hover:text-gray-400">
                Editor
              </Link>
            </>
          )}

          {user ? (
            <>
              <Link href="/profile" className="hover:text-gray-400">
                Profile
              </Link>
              <Link href="/creator" className="hover:text-gray-400">
                Analytics
              </Link>
              <Link href="/transparency" className="hover:text-gray-400">
                Transparency
              </Link>
              <Link href="/governance" className="hover:text-gray-400">
                Governance
              </Link>
              <Link href="/sounds" className="hover:text-gray-400">
                Sounds
              </Link>
              <button onClick={signOut} className="hover:text-gray-400">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="hover:text-gray-400">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
