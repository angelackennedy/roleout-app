'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type MallProduct = {
  id: string;
  post_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  price: number;
  product_url: string | null;
  image_url: string | null;
  network: string | null;
  tracking_url: string | null;
  clicks: number;
  sales: number;
  views: number;
  created_at: string;
  creator_username?: string;
  creator_avatar?: string;
  post_video_url?: string;
  post_image_url?: string;
};

function ProductCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg animate-pulse">
      <div className="relative aspect-square bg-gray-700"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-9 bg-gray-700 rounded-lg"></div>
          <div className="flex-1 h-9 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default function MallPage() {
  const router = useRouter();
  const [products, setProducts] = useState<MallProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mall/products', { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPost = (product: MallProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/post/${product.post_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🛍️ ROLL OUT Mall</h1>
            <p className="text-gray-400">Shop products from creators</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">❌</div>
        <div className="text-2xl font-bold mb-2">{error}</div>
        <Link href="/" className="text-yellow-500 hover:text-yellow-400 underline mt-4">
          ← Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">🛍️ ROLL OUT Mall</h1>
          <p className="text-gray-400">Shop products from creators</p>
          <Link href="/" className="text-yellow-500 hover:text-yellow-400 text-sm underline mt-2 inline-block">
            ← Back to Feed
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">🛒</div>
            <div className="text-2xl font-bold mb-3">No products yet</div>
            <div className="text-gray-400 mb-6">Check back soon as creators add products!</div>
            <Link
              href="/"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Browse Feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-700/50 hover:border-yellow-500/50"
              >
                <div className="relative aspect-square bg-gray-700 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : product.post_video_url ? (
                    <video
                      src={product.post_video_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : product.post_image_url ? (
                    <img
                      src={product.post_image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-700 to-gray-800">
                      🛍️
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.network && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg border border-purple-400/30">
                      🔗 Affiliate
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {product.title}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                  )}

                  <Link 
                    href={`/mall/@${product.creator_username}`}
                    className="flex items-center gap-2 mb-3 no-underline hover:opacity-80 transition-opacity"
                  >
                    {product.creator_avatar ? (
                      <img
                        src={product.creator_avatar}
                        alt={product.creator_username}
                        className="w-6 h-6 rounded-full border border-gray-600"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-600/30 to-yellow-600/10 border border-gray-600"></div>
                    )}
                    <span className="text-sm text-yellow-400/90 hover:text-yellow-300">
                      @{product.creator_username || 'creator'}
                    </span>
                  </Link>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <span>👁️</span>
                      <span>{product.views}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>👆</span>
                      <span>{product.clicks}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💰</span>
                      <span>{product.sales}</span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleViewPost(product, e)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    >
                      View Post
                    </button>
                    <a
                      href={`/api/mall/click/${product.id}?ref=mall`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 text-center shadow-lg"
                    >
                      Buy Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
