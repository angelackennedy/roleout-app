'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ManagedProduct = {
  id: string;
  post_id: string;
  title: string;
  description: string | null;
  price: number;
  product_url: string | null;
  image_url: string | null;
  clicks: number;
  sales: number;
  views: number;
  created_at: string;
};

export default function MallManagePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchMyProducts();
  }, [user]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mall/my-products', { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      
      const totalClicks = data.products.reduce((sum: number, p: ManagedProduct) => sum + p.clicks, 0);
      const totalSales = data.products.reduce((sum: number, p: ManagedProduct) => sum + p.sales, 0);
      const totalRevenue = data.products.reduce((sum: number, p: ManagedProduct) => sum + (p.price * p.sales), 0);
      
      setStats({ totalClicks, totalSales, totalRevenue });
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading your products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Manage Mall Products</h1>
          <p className="text-gray-400 mb-4">Track your product performance</p>
          <div className="flex gap-4">
            <Link href="/mall" className="text-yellow-500 hover:text-yellow-400 text-sm underline">
              ← View Mall
            </Link>
            <Link href="/creator" className="text-yellow-500 hover:text-yellow-400 text-sm underline">
              Creator Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-blue-200 mb-2">Total Clicks</div>
            <div className="text-4xl font-bold">{stats.totalClicks.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-green-200 mb-2">Total Sales</div>
            <div className="text-4xl font-bold">{stats.totalSales.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-yellow-200 mb-2">Total Revenue</div>
            <div className="text-4xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-8">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-xl mb-2">No products yet</div>
            <div className="text-gray-400 mb-4">Add products to your posts to start selling</div>
            <Link
              href="/upload"
              className="inline-block bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Your Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-300">Product</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Price</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Views</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Clicks</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Sales</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Revenue</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.title}</div>
                            {product.description && (
                              <div className="text-xs text-gray-400 line-clamp-1">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {product.views}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {product.clicks}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {product.sales}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-yellow-400">
                        ${(product.price * product.sales).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          href={`/post/${product.post_id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                        >
                          View Post
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
