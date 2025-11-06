'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [origin, setOrigin] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '❌ Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setMessage({ type: 'info', text: '📧 Sending magic link...' });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: origin ? `${origin}/test-supabase` : '/test-supabase',
        },
      });

      if (error) {
        console.error('Magic link error:', error);
        setMessage({ type: 'error', text: `❌ ${error.message}` });
      } else {
        setMessage({ 
          type: 'success', 
          text: '✅ Check your email! Click the magic link to sign in.' 
        });
        setEmail('');
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 900,
            marginBottom: 10,
            background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.05em',
          }}>
            ROLE OUT
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 16,
          }}>
            Sign in with magic link
          </p>
        </div>

        <form onSubmit={handleMagicLink} style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 32,
        }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(212,175,55,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '📧 Sending...' : '✨ Send Magic Link'}
          </button>

          <p style={{
            marginTop: 20,
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            We'll send you a secure login link. No password needed!
          </p>
        </form>

        {message && (
          <div style={{
            marginTop: 24,
            background: message.type === 'success' 
              ? 'rgba(0,255,0,0.1)' 
              : message.type === 'error'
              ? 'rgba(255,0,0,0.1)'
              : 'rgba(255,255,0,0.1)',
            border: `1px solid ${message.type === 'success' 
              ? 'rgba(0,255,0,0.3)' 
              : message.type === 'error'
              ? 'rgba(255,0,0,0.3)'
              : 'rgba(255,255,0,0.3)'}`,
            borderRadius: 8,
            padding: 16,
            fontSize: 14,
            lineHeight: 1.5,
          }}>
            {message.text}
          </div>
        )}

        <div style={{
          marginTop: 32,
          textAlign: 'center',
        }}>
          <a
            href="/test-supabase"
            style={{
              color: 'rgba(212,175,55,0.8)',
              fontSize: 14,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(212,175,55,0.3)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'}
          >
            Go to Test Page →
          </a>
        </div>
      </div>
    </div>
  );
}
