'use client';

import { useEffect, useState } from 'react';
import { MODE } from '@/lib/config';

let supabase: any = null;
if (MODE === "supabase") {
  const supabaseModule = require('@/lib/supabase');
  supabase = supabaseModule.supabase;
}

export default function TestAuthPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [signupResult, setSignupResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (MODE === "supabase") {
      // Test health endpoint on load
      fetch('/api/health')
        .then(res => res.json())
        .then(data => {
          console.log('[Test Auth] Health check:', data);
          setHealthStatus(data);
        })
        .catch(err => {
          console.error('[Test Auth] Health check error:', err);
          setHealthStatus({ error: err.message });
        });
    }
  }, []);

  const testSignup = async () => {
    if (MODE !== "supabase") {
      setSignupResult({
        success: false,
        error: { message: "Auth testing only available in Supabase mode" },
        timestamp: new Date().toISOString()
      });
      return;
    }

    setLoading(true);
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('[Test Auth] Attempting signup with:', testEmail);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      const result = {
        success: !error,
        data: data,
        error: error,
        timestamp: new Date().toISOString()
      };
      
      console.log('[Test Auth] Signup result:', result);
      setSignupResult(result);
    } catch (err: any) {
      console.error('[Test Auth] Signup exception:', err);
      setSignupResult({
        success: false,
        error: {
          message: err.message,
          name: err.name,
          stack: err.stack
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔧 Auth Diagnostics</h1>
      
      <div className="space-y-6">
        {/* Health Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Health Check</h2>
          {healthStatus ? (
            <pre className="bg-gray-950 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}
        </div>

        {/* Signup Test */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Signup Test</h2>
          <button
            onClick={testSignup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </button>
          
          {signupResult && (
            <div className="mt-4">
              <div className={`p-3 rounded mb-2 ${signupResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {signupResult.success ? '✅ Success' : '❌ Failed'}
              </div>
              <pre className="bg-gray-950 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(signupResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">📋 Supabase Auth Settings Checklist</h3>
          <p className="mb-4 text-sm text-gray-300">Please verify these settings in your Supabase Dashboard → Authentication → URL Configuration:</p>
          <ul className="space-y-2 text-sm">
            <li>✓ Site URL: <code className="bg-gray-800 px-2 py-1 rounded">https://57b145d8-aea0-4b2a-847b-e7c88aa3ee5c-00-3f16qckq9vswb.riker.replit.dev</code></li>
            <li>✓ Redirect URLs: Same URL on its own line (no trailing /)</li>
            <li>✓ Email Provider → "Allow new users to sign up": ON</li>
            <li>✓ Email Provider → "Confirm email": OFF (for testing)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
