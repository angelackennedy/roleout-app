"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useNotificationCount } from "@/lib/hooks/useNotificationCount";
import { supabase } from "@/lib/supabase";
import CommandPalette from "./CommandPalette";

const mainTabs = [
  { name: "For You", href: "/" },
  { name: "Following", href: "/following" },
  { name: "Discover", href: "/discover" },
  { name: "Trending", href: "/trending" },
  { name: "Mall", href: "/mall" },
  { name: "Profile", href: "/profile" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotificationCount(user?.id || null);
  const [username, setUsername] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUsername(data.username);
        });
    } else {
      setUsername(null);
    }
  }, [user]);

  // Keyboard shortcut for command palette (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActiveTab = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] border-b border-gray-800 shadow-md">
        <nav className="max-w-7xl mx-auto px-4">
          {/* Top row: Logo + Search + User actions */}
          <div className="flex justify-between items-center py-3 border-b border-gray-800/50">
            <Link href="/" className="text-xl font-bold tracking-wider">
              <span className="text-white">ROLL</span>
              <span className="text-yellow-500"> CALL</span>
            </Link>

            {/* Compact search input */}
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full text-left text-gray-400 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between"
              >
                <span>Search users, sounds, hashtags, products...</span>
                <kbd className="text-xs bg-gray-700 px-2 py-0.5 rounded">⌘K</kbd>
              </button>
            </div>

            {/* User actions */}
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <Link 
                    href="/notifications" 
                    className="relative hover:text-yellow-500 transition-colors"
                  >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/inbox" className="hover:text-yellow-500 transition-colors">
                    💬
                  </Link>
                  <Link href="/upload" className="px-3 py-1.5 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors">
                    + Upload
                  </Link>
                  {username && (
                    <Link href={`/u/${username}`} className="hover:text-yellow-500 transition-colors">
                      @{username}
                    </Link>
                  )}
                  <div className="relative group">
                    <button className="text-gray-400 hover:text-white">⋮</button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link href="/creator" className="block px-4 py-2 hover:bg-gray-800 text-sm">
                        📊 Analytics
                      </Link>
                      <Link href="/transparency" className="block px-4 py-2 hover:bg-gray-800 text-sm">
                        🔍 Transparency
                      </Link>
                      <Link href="/governance" className="block px-4 py-2 hover:bg-gray-800 text-sm">
                        🗳️ Governance
                      </Link>
                      <Link href="/sounds" className="block px-4 py-2 hover:bg-gray-800 text-sm">
                        🎵 Sounds
                      </Link>
                      <Link href="/editor" className="block px-4 py-2 hover:bg-gray-800 text-sm">
                        ✂️ Editor
                      </Link>
                      <button onClick={signOut} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm border-t border-gray-700 text-red-400">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link href="/auth/login" className="px-4 py-1.5 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Bottom row: Main tabs (desktop only) */}
          <div className="hidden md:flex gap-1 py-2 overflow-x-auto">
            {mainTabs.map((tab) => {
              const active = isActiveTab(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    active
                      ? 'bg-yellow-500 text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </>
  );
}
