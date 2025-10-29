import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col gap-8 items-center max-w-2xl">
        <h1 className="text-4xl font-bold text-center">
          Welcome to RollCall
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400">
          A video social platform with transparent moderation
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
          <Link
            href="/feed"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <h2 className="text-xl font-semibold mb-2">📱 Feed</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse video posts
            </p>
          </Link>
          
          <Link
            href="/upload"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <h2 className="text-xl font-semibold mb-2">📹 Upload</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share a video (≤60s)
            </p>
          </Link>
          
          <Link
            href="/profile"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <h2 className="text-xl font-semibold mb-2">👤 Profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your profile
            </p>
          </Link>
          
          <Link
            href="/moderation"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <h2 className="text-xl font-semibold mb-2">🛡️ Moderation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transparency Panel (FA³)
            </p>
          </Link>
          
          <Link
            href="/wallet"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <h2 className="text-xl font-semibold mb-2">💰 Wallet</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Placeholder (FA⁴)
            </p>
          </Link>
          
          <Link
            href="/metrics"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <h2 className="text-xl font-semibold mb-2">📊 Metrics</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analytics (FA⁵)
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
