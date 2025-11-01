"use client";
import "./splash.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
  sessionStorage.setItem("roleout_seen_splash", "1");
  const t = setTimeout(() => router.push("/feed"), 2200); // 2.2 seconds delay
  return () => clearTimeout(t);
}, [router]);

  return (
    <main className="splash">
      <div className="splash-logo">
        <span className="beam" aria-hidden />
        <span className="logo-top">
          RO<span className="spot" />LE
        </span>
        <span className="logo-bottom">OUT</span>
      </div>
      <p className="splash-tag">
        A video social platform with transparent moderation
      </p>
    </main>
  );
}
