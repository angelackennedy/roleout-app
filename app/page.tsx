import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col gap-8 items-center max-w-2xl">
        <h1 className="text-4xl font-bold text-center">Welcome to ROLE OUT</h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400">
          A video social platform with transparent moderation
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
          <section
            className="grid"
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              padding: "10px 0 60px",
            }}
          >
            <Link href="/feed" className="card">
              <div className="card-icon">📰</div>
              <div>
                <div className="card-title">Feed</div>
                <div className="card-sub">Browse video posts</div>
              </div>
            </Link>

            <Link href="/upload" className="card">
              <div className="card-icon">📤</div>
              <div>
                <div className="card-title">Upload</div>
                <div className="card-sub">Share a video (≤60 s)</div>
              </div>
            </Link>

            <Link href="/profile" className="card">
              <div className="card-icon">👤</div>
              <div>
                <div className="card-title">Profile</div>
                <div className="card-sub">View your profile</div>
              </div>
            </Link>

            <Link href="/moderation" className="card">
              <div className="card-icon">🛡️</div>
              <div>
                <div className="card-title">Moderation</div>
                <div className="card-sub">Transparency Panel (FA³)</div>
              </div>
            </Link>

            <Link href="/wallet" className="card">
              <div className="card-icon">💰</div>
              <div>
                <div className="card-title">Wallet</div>
                <div className="card-sub">Placeholder (FA³)</div>
              </div>
            </Link>

            <Link href="/metrics" className="card">
              <div className="card-icon">📊</div>
              <div>
                <div className="card-title">Metrics</div>
                <div className="card-sub">Analytics (FA³)</div>
              </div>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
