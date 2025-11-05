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
  network: string | null;
  tracking_url: string | null;
  created_at: string;
};

export default function MallManagePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [editingProduct, setEditingProduct] = useState<ManagedProduct | null>(null);
  const [affiliateProduct, setAffiliateProduct] = useState<ManagedProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    productUrl: '',
    imageUrl: '',
  });

  const [affiliateForm, setAffiliateForm] = useState({
    network: '',
    trackingUrl: '',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
    fetchMyProducts();
  }, [user, authLoading]);

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

  const handleEditClick = (product: ManagedProduct) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      description: product.description || '',
      price: product.price,
      productUrl: product.product_url || '',
      imageUrl: product.image_url || '',
    });
  };

  const handleAffiliateClick = (product: ManagedProduct) => {
    setAffiliateProduct(product);
    setAffiliateForm({
      network: product.network || '',
      trackingUrl: product.tracking_url || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    setSaving(true);
    try {
      const response = await fetch('/api/mall/update-product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingProduct.id,
          title: editForm.title,
          description: editForm.description,
          price: editForm.price,
          productUrl: editForm.productUrl,
          imageUrl: editForm.imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      await fetchMyProducts();
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Error updating product:', err);
      alert(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAffiliate = async () => {
    if (!affiliateProduct) return;

    if (!affiliateForm.network || !affiliateForm.trackingUrl) {
      alert('Network and tracking URL are required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/mall/set-affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: affiliateProduct.id,
          network: affiliateForm.network,
          trackingUrl: affiliateForm.trackingUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set affiliate');
      }

      await fetchMyProducts();
      setAffiliateProduct(null);
    } catch (err: any) {
      console.error('Error setting affiliate:', err);
      alert(err.message || 'Failed to set affiliate');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24">
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
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Clicks</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Sales</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-300">Status</th>
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
                          <div className="max-w-[200px]">
                            <div className="font-medium truncate">{product.title}</div>
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
                        {product.clicks}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {product.sales}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {product.network ? (
                          <span className="inline-block bg-purple-600/30 border border-purple-500/50 px-2 py-1 rounded-full text-xs font-semibold">
                            🔗 Affiliate
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-700/50 px-2 py-1 rounded-full text-xs text-gray-400">
                            Direct
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs font-semibold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAffiliateClick(product)}
                            className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-xs font-semibold transition"
                          >
                            {product.network ? 'Update Affiliate' : 'Set Affiliate'}
                          </button>
                          <Link
                            href={`/post/${product.post_id}`}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-xs font-semibold transition"
                          >
                            View Post
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full border border-yellow-500/30 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Edit Product</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="Product title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none h-20 resize-none"
                  placeholder="Product description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Product URL</label>
                <input
                  type="url"
                  value={editForm.productUrl}
                  onChange={(e) => setEditForm({ ...editForm, productUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                disabled={saving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {affiliateProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Set Affiliate Tracking</h3>
            <p className="text-sm text-gray-400 mb-4">Configure affiliate network and tracking URL</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Affiliate Network *</label>
                <input
                  type="text"
                  value={affiliateForm.network}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, network: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Amazon Associates, ShareASale"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tracking URL *</label>
                <input
                  type="url"
                  value={affiliateForm.trackingUrl}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, trackingUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="https://affiliate.link/..."
                />
                <p className="text-xs text-gray-400 mt-1">This is the URL users will be redirected to (with tracking)</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveAffiliate}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Affiliate'}
              </button>
              <button
                onClick={() => setAffiliateProduct(null)}
                disabled={saving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
