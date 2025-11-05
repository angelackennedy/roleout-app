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
  clicks: number;
  sales: number;
  views: number;
  created_at: string;
  creator_username?: string;
  creator_avatar?: string;
  post_video_url?: string;
  post_image_url?: string;
  is_affiliate?: boolean;
};

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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading mall...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-2xl mb-4">❌ {error}</div>
        <Link href="/" className="text-yellow-500 hover:text-yellow-400 underline">
          ← Back to Home
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
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <div className="text-xl mb-2">No products yet</div>
            <div className="text-gray-400">Creators can add products to their posts</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="relative aspect-square bg-gray-700">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🛍️
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.is_affiliate && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      🔗 Affiliate
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.title}</h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    {product.creator_avatar && (
                      <img
                        src={product.creator_avatar}
                        alt={product.creator_username}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-400">
                      @{product.creator_username || 'creator'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>👁️ {product.views}</span>
                    <span>👆 {product.clicks}</span>
                    <span>💰 {product.sales} sales</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleViewPost(product, e)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
                    >
                      View Post
                    </button>
                    <a
                      href={`/api/mall/click/${product.id}?ref=mall`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded text-sm font-semibold transition-colors text-center"
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
