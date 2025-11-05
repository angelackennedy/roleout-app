"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "For You", href: "/", icon: "🏠" },
  { name: "Following", href: "/following", icon: "👥" },
  { name: "Discover", href: "/discover", icon: "🔍" },
  { name: "Trending", href: "/trending", icon: "🔥" },
  { name: "Mall", href: "/mall", icon: "🛍️" },
  { name: "Profile", href: "/profile", icon: "👤" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  const isActiveTab = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0A0A0A] to-[#1A1A1A] border-t border-gray-800 pb-safe">
      <div className="flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => {
          const active = isActiveTab(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all min-w-[60px] ${
                active
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
