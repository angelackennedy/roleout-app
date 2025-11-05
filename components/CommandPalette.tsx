"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  type: 'user' | 'sound' | 'hashtag' | 'product';
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
};

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      router.push(results[selectedIndex].href);
      onClose();
    }
  };

  // Fuzzy search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];
      const searchTerm = query.toLowerCase().trim();

      try {
        // Search users (@username)
        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(5);

        if (users) {
          users.forEach((user) => {
            searchResults.push({
              type: 'user',
              id: user.id,
              title: `@${user.username}`,
              subtitle: user.display_name || undefined,
              icon: '@',
              href: `/u/${user.username}`,
            });
          });
        }

        // Search sounds (🎵)
        const { data: sounds } = await supabase
          .from('sounds')
          .select('id, name, artist')
          .or(`name.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
          .limit(5);

        if (sounds) {
          sounds.forEach((sound) => {
            searchResults.push({
              type: 'sound',
              id: sound.id,
              title: sound.name,
              subtitle: sound.artist,
              icon: '🎵',
              href: `/sound/${sound.id}`,
            });
          });
        }

        // Search hashtags (#)
        const { data: posts } = await supabase
          .from('posts')
          .select('hashtags')
          .not('hashtags', 'is', null)
          .limit(100);

        if (posts) {
          const allHashtags = new Set<string>();
          posts.forEach((post) => {
            if (post.hashtags) {
              post.hashtags.forEach((tag: string) => {
                if (tag.toLowerCase().includes(searchTerm)) {
                  allHashtags.add(tag);
                }
              });
            }
          });

          Array.from(allHashtags).slice(0, 5).forEach((tag) => {
            searchResults.push({
              type: 'hashtag',
              id: tag,
              title: `#${tag}`,
              icon: '#',
              href: `/tag/${tag}`,
            });
          });
        }

        // Search products (🛍️)
        const { data: products } = await supabase
          .from('mall_products')
          .select('id, name, price')
          .ilike('name', `%${searchTerm}%`)
          .eq('is_active', true)
          .limit(5);

        if (products) {
          products.forEach((product) => {
            searchResults.push({
              type: 'product',
              id: product.id,
              title: product.name,
              subtitle: `$${product.price}`,
              icon: '🛍️',
              href: `/mall/product/${product.id}`,
            });
          });
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search users (@), sounds (🎵), hashtags (#), products (🛍️)..."
              className="w-full bg-transparent text-white text-lg outline-none placeholder:text-gray-500"
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="p-8 text-center text-gray-500">
                Searching...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}"
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      router.push(result.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-2xl">{result.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-500">{result.subtitle}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 uppercase">
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && !query && (
              <div className="p-8 text-center text-gray-500">
                <div className="mb-4 text-4xl">🔍</div>
                <div className="text-sm">
                  Start typing to search across users, sounds, hashtags, and products
                </div>
                <div className="mt-4 text-xs text-gray-600">
                  Use <kbd className="bg-gray-800 px-2 py-1 rounded">↑</kbd> <kbd className="bg-gray-800 px-2 py-1 rounded">↓</kbd> to navigate
                  · <kbd className="bg-gray-800 px-2 py-1 rounded">Enter</kbd> to select
                  · <kbd className="bg-gray-800 px-2 py-1 rounded">Esc</kbd> to close
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
