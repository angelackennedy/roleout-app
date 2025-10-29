'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">
            FA⁴: Cryptocurrency wallet integration (placeholder)
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-2xl font-bold mb-4">Wallet Coming Soon</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            This module will enable cryptocurrency payments, tipping creators, and managing your
            digital wallet.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="font-semibold mb-1">Connect Wallet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Link your crypto wallet
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">💸</div>
              <h3 className="font-semibold mb-1">Tip Creators</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Support your favorite content
              </p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Track Earnings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your revenue
              </p>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>Planned features:</p>
            <ul className="mt-2 space-y-1">
              <li>• Multi-chain wallet support (Ethereum, Polygon, etc.)</li>
              <li>• Creator tipping and donations</li>
              <li>• NFT integration for exclusive content</li>
              <li>• Transaction history and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
