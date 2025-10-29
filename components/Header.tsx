'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            RollCall
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/feed"
              className="text-sm hover:text-gray-600 dark:hover:text-gray-300"
            >
              Feed
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/upload"
                  className="text-sm hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Upload
                </Link>
                <Link
                  href="/profile"
                  className="text-sm hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Profile
                </Link>
                <Link
                  href="/moderation"
                  className="text-sm hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Moderation
                </Link>
                <button
                  onClick={signOut}
                  className="text-sm px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
