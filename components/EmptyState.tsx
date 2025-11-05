"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actions?: { label: string; href: string; primary?: boolean }[];
}

export default function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-8xl mb-6">{icon}</div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-400 max-w-md mb-8">{description}</p>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                action.primary
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
