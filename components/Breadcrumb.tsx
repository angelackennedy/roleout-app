"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  showBackButton?: boolean;
}

export default function Breadcrumb({ items, showBackButton = true }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 mb-6 text-sm">
      {showBackButton && (
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
      )}

      <nav className="flex items-center gap-2 text-gray-400">
        <Link href="/" className="hover:text-white transition-colors">
          🏠 Home
        </Link>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span>/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-white font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
