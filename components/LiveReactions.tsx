'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';

type Emoji = '❤️' | '🔥' | '👏';

interface LiveReaction {
  id: string;
  session_id: string;
  user_id: string;
  emoji: Emoji;
  created_at: string;
}

interface FloatingParticle {
  id: number;
  emoji: Emoji;
  x: number;
  y: number;
}

interface LiveReactionsProps {
  sessionId: string;
  userId: string | null;
}

export default function LiveReactions({ sessionId, userId }: LiveReactionsProps) {
  const [counts, setCounts] = useState<Record<Emoji, number>>({
    '❤️': 0,
    '🔥': 0,
    '👏': 0,
  });
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const particleIdRef = useRef(0);
  
  // Throttling: track reaction counts per emoji (max 5 per 3 seconds)
  const throttleRef = useRef<Record<Emoji, number[]>>({
    '❤️': [],
    '🔥': [],
    '👏': [],
  });

  // Fetch initial reaction counts using aggregate function
  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_reaction_counts', {
        p_session_id: sessionId,
      });

      if (error) {
        console.error('Error fetching reactions:', error);
      } else {
        // Initialize counts
        const newCounts: Record<Emoji, number> = {
          '❤️': 0,
          '🔥': 0,
          '👏': 0,
        };
        
        // Set counts from RPC results
        data?.forEach((row: { emoji: string; count: number }) => {
          if (row.emoji in newCounts) {
            newCounts[row.emoji as Emoji] = row.count;
          }
        });
        
        setCounts(newCounts);
      }
    } catch (err) {
      console.error('Unexpected error fetching reactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Track optimistic reactions to prevent double-counting
  const optimisticReactionsRef = useRef<Set<string>>(new Set());

  // Send a reaction
  const sendReaction = async (emoji: Emoji) => {
    if (!userId) {
      return;
    }

    // Check throttle: max 5 reactions per 3 seconds per emoji
    const now = Date.now();
    const recentReactions = throttleRef.current[emoji].filter(
      (timestamp) => now - timestamp < 3000
    );

    if (recentReactions.length >= 5) {
      console.log('Throttled: too many reactions');
      return;
    }

    // Create temporary ID for optimistic update tracking
    const tempId = `${userId}-${emoji}-${now}`;
    optimisticReactionsRef.current.add(tempId);

    // Optimistic UI: increment counter immediately
    setCounts((prev) => ({
      ...prev,
      [emoji]: prev[emoji] + 1,
    }));

    // Add floating particle animation
    addParticle(emoji);

    // Update throttle tracker
    throttleRef.current[emoji] = [...recentReactions, now];

    try {
      const { error } = await supabase
        .from('live_reactions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          emoji,
        });

      if (error) {
        console.error('Error sending reaction:', error);
        // Rollback on error
        setCounts((prev) => ({
          ...prev,
          [emoji]: Math.max(prev[emoji] - 1, 0),
        }));
        optimisticReactionsRef.current.delete(tempId);
      }
    } catch (err) {
      console.error('Unexpected error sending reaction:', err);
      // Rollback on error
      setCounts((prev) => ({
        ...prev,
        [emoji]: Math.max(prev[emoji] - 1, 0),
      }));
      optimisticReactionsRef.current.delete(tempId);
    }
  };

  // Add floating particle
  const addParticle = (emoji: Emoji) => {
    const id = particleIdRef.current++;
    const x = Math.random() * 100; // Random X position (0-100%)
    const y = 100; // Start at bottom

    setParticles((prev) => [...prev, { id, emoji, x, y }]);

    // Remove particle after animation (2 seconds)
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 2000);
  };

  // Check if throttled
  const isThrottled = (emoji: Emoji): boolean => {
    const now = Date.now();
    const recentReactions = throttleRef.current[emoji].filter(
      (timestamp) => now - timestamp < 3000
    );
    return recentReactions.length >= 5;
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchReactions();

    // Subscribe to new reactions
    const channel = supabase
      .channel(`live_reactions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_reactions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New reaction received:', payload);
          const newReaction = payload.new as LiveReaction;
          
          // Skip if this was our own optimistic update
          if (newReaction.user_id === userId) {
            // Just clean up the optimistic tracking set
            setTimeout(() => {
              optimisticReactionsRef.current.clear();
            }, 1000);
            return;
          }

          // Increment counter for reactions from other users
          setCounts((prev) => ({
            ...prev,
            [newReaction.emoji]: prev[newReaction.emoji] + 1,
          }));

          // Show particle animation for other users
          addParticle(newReaction.emoji);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, userId]);

  const emojis: Emoji[] = ['❤️', '🔥', '👏'];

  return (
    <div style={{ position: 'relative' }}>
      {/* Reaction Buttons */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {userId ? (
          emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              disabled={isThrottled(emoji)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: isThrottled(emoji) 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: 'white',
                fontSize: 18,
                cursor: isThrottled(emoji) ? 'not-allowed' : 'pointer',
                opacity: isThrottled(emoji) ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isThrottled(emoji)) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>{emoji}</span>
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
              }}>
                {loading ? '...' : counts[emoji]}
              </span>
            </button>
          ))
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              Sign in to react
            </span>
            <Link
              href="/login"
              className="nav-btn"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              Sign In →
            </Link>
          </div>
        )}
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            bottom: 0,
            fontSize: 32,
            pointerEvents: 'none',
            animation: 'float-up 2s ease-out forwards',
            zIndex: 1000,
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-200px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
