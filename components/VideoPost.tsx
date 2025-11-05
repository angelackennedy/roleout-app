'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePostLike } from '@/lib/hooks/usePostLike';
import { CommentsDrawer } from '@/components/CommentsDrawer';
import { ReportDialog } from '@/components/ReportDialog';

type PostWithNested = {
  id: string;
  user_id: string;
  video_url: string;
  cover_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  mall_products?: Array<{
    id: string;
    title: string;
    price: number;
  }>;
};

type PostWithFlat = {
  id: string;
  user_id: string;
  video_url: string;
  cover_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  mall_products?: Array<{
    id: string;
    title: string;
    price: number;
  }>;
};

type Post = PostWithNested | PostWithFlat;

interface VideoPostProps {
  post: Post;
  isActive: boolean;
  userId?: string | null;
}

function hasNestedProfile(post: Post): post is PostWithNested {
  return 'profiles' in post;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diff = now.getTime() - past.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function VideoPost({ post, isActive, userId = null }: VideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showProductPrice, setShowProductPrice] = useState(false);
  
  const watchTimeRef = useRef(0);
  const lastVisibleTimeRef = useRef<number | null>(null);
  const impressionTrackedRef = useRef(false);
  const hasLikedRef = useRef(false);
  const hasCommentedRef = useRef(false);
  const hasFollowedRef = useRef(false);

  const { isLiked, likeCount, toggleLike, isLoading } = usePostLike({
    postId: post.id,
    initialLikeCount: post.like_count,
    userId,
  });

  const username = hasNestedProfile(post) ? post.profiles.username : post.username;
  const displayName = hasNestedProfile(post) ? post.profiles.display_name : post.display_name;
  const avatarUrl = hasNestedProfile(post) ? post.profiles.avatar_url : post.avatar_url;
  const product = post.mall_products && post.mall_products.length > 0 ? post.mall_products[0] : null;

  const sendImpression = async (additionalData: {
    liked?: boolean;
    commented?: boolean;
    followed_creator?: boolean;
  } = {}) => {
    if (!userId) return;

    try {
      await fetch('/api/impressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          ms_watched: watchTimeRef.current,
          liked: hasLikedRef.current || additionalData.liked || false,
          commented: hasCommentedRef.current || additionalData.commented || false,
          followed_creator: hasFollowedRef.current || additionalData.followed_creator || false,
        }),
      });
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const now = Date.now();
          
          if (entry.intersectionRatio >= 0.5) {
            lastVisibleTimeRef.current = now;
            
            if (!impressionTrackedRef.current) {
              setTimeout(() => {
                if (lastVisibleTimeRef.current !== null) {
                  impressionTrackedRef.current = true;
                  sendImpression();
                }
              }, 2000);
            }
          } else {
            if (lastVisibleTimeRef.current !== null) {
              const elapsed = now - lastVisibleTimeRef.current;
              watchTimeRef.current += elapsed;
              lastVisibleTimeRef.current = null;
              
              if (impressionTrackedRef.current) {
                sendImpression();
              }
            }
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(container);

    const watchTimeInterval = setInterval(() => {
      if (lastVisibleTimeRef.current !== null) {
        const now = Date.now();
        const elapsed = now - lastVisibleTimeRef.current;
        watchTimeRef.current += elapsed;
        lastVisibleTimeRef.current = now;
        
        if (impressionTrackedRef.current && elapsed > 0) {
          sendImpression();
        }
      }
    }, 5000);

    return () => {
      if (lastVisibleTimeRef.current !== null) {
        const elapsed = Date.now() - lastVisibleTimeRef.current;
        watchTimeRef.current += elapsed;
        
        if (impressionTrackedRef.current) {
          sendImpression();
        }
      }
      clearInterval(watchTimeInterval);
      observer.disconnect();
    };
  }, [userId, post.id]);

  useEffect(() => {
    if (isLiked && !hasLikedRef.current) {
      hasLikedRef.current = true;
      sendImpression({ liked: true });
    }
  }, [isLiked]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full snap-start bg-black flex items-center justify-center"
    >
      <div className="relative w-full max-w-[500px] aspect-[9/16] mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          src={post.video_url}
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
          onClick={handleVideoClick}
          className="w-full h-full object-cover cursor-pointer"
        />

        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/80">👁️ {formatViews(post.view_count || 0)}</span>
              <span className="text-xs text-white/60">•</span>
              <span className="text-xs text-white/80">{formatTimeAgo(post.created_at)}</span>
            </div>
            
            <Link
              href="/upload"
              className="bg-yellow-500/90 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm font-semibold flex items-center gap-1 hover:bg-yellow-600 transition-colors"
            >
              <span className="text-lg">+</span>
              Upload
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <Link
            href={`/u/${username}`}
            className="flex items-center gap-3 mb-3 no-underline text-white group"
          >
            <div 
              className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-base font-bold overflow-hidden bg-gradient-to-br from-yellow-600/30 to-yellow-600/10"
              style={{
                backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!avatarUrl && username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-base group-hover:text-yellow-400 transition-colors">
                {displayName || username}
              </div>
              <div className="text-xs text-white/70">
                @{username}
              </div>
            </div>
          </Link>

          {post.caption && (
            <div className="text-sm leading-relaxed mb-2 text-white line-clamp-2">
              {post.caption}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.hashtags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${tag}`}
                    className="text-xs text-yellow-400/90 font-medium no-underline hover:text-yellow-300 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <span>🎵</span>
              <span>Original Sound - {username}</span>
            </div>
            
            <div className="bg-purple-600/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white border border-purple-400/30">
              🟣 FS: 92
            </div>
          </div>

          {product && (
            <div 
              className="relative mt-3"
              onMouseEnter={() => setShowProductPrice(true)}
              onMouseLeave={() => setShowProductPrice(false)}
              onTouchStart={() => setShowProductPrice(!showProductPrice)}
            >
              <Link
                href={`/api/mall/click/${product.id}?ref=feed`}
                className="inline-flex items-center gap-2 bg-indigo-600/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold border border-indigo-400/30 hover:bg-indigo-700 transition-all hover:scale-105 no-underline"
              >
                <span>🛍️</span>
                <span>View product</span>
                {showProductPrice && (
                  <span className="ml-1 text-yellow-300">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>

        <div className="absolute right-4 bottom-24 flex flex-col gap-4">
          <button 
            onClick={toggleLike}
            disabled={isLoading}
            className="bg-black/50 backdrop-blur-sm border-2 border-white rounded-full w-14 h-14 flex flex-col items-center justify-center text-2xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-transform"
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span className="text-xs font-semibold mt-1 text-white">
              {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
            </span>
          </button>

          <button 
            onClick={() => setCommentsOpen(true)}
            className="bg-black/50 backdrop-blur-sm border-2 border-white rounded-full w-14 h-14 flex flex-col items-center justify-center text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
          >
            <span>💬</span>
            <span className="text-xs font-semibold mt-1 text-white">
              {post.comment_count > 999 ? `${(post.comment_count / 1000).toFixed(1)}k` : post.comment_count}
            </span>
          </button>

          <button 
            className="bg-black/50 backdrop-blur-sm border-2 border-white rounded-full w-14 h-14 flex flex-col items-center justify-center text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
          >
            <span>↗️</span>
            <span className="text-xs font-semibold mt-1 text-white">
              {post.share_count}
            </span>
          </button>

          {product && (
            <Link
              href={`/mall/${username}`}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 backdrop-blur-sm border-2 border-white rounded-full w-14 h-14 flex items-center justify-center text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform no-underline"
            >
              <span>🛍️</span>
            </Link>
          )}

          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-black/50 backdrop-blur-sm border-2 border-white rounded-full w-14 h-14 flex items-center justify-center text-2xl cursor-pointer text-white hover:scale-110 active:scale-95 transition-transform"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="absolute right-16 top-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-2 min-w-[160px] border-2 border-yellow-600/30 shadow-2xl">
                <button
                  onClick={async () => {
                    if (!userId) {
                      alert('Please login to hide posts');
                      setMenuOpen(false);
                      return;
                    }
                    
                    try {
                      const { error } = await supabase
                        .from('hidden_posts')
                        .insert({
                          user_id: userId,
                          post_id: post.id,
                        });

                      if (error) {
                        if (error.code === '23505') {
                          alert('Post already hidden');
                        } else {
                          console.error('Error hiding post:', error);
                          alert('Failed to hide post');
                        }
                      } else {
                        alert('Post hidden from your feed');
                        window.location.reload();
                      }
                    } catch (err) {
                      console.error('Error:', err);
                      alert('Failed to hide post');
                    }
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-3 bg-transparent border-none text-white text-sm font-medium cursor-pointer text-left rounded-lg hover:bg-yellow-600/20 transition-colors"
                >
                  🙈 Hide this post
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="w-full px-3 py-3 bg-transparent border-none text-white text-sm font-medium cursor-pointer text-left rounded-lg hover:bg-yellow-600/20 transition-colors"
                >
                  🚩 Report
                </button>
              </div>
            )}
          </div>
        </div>

        {isMuted && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-4 pointer-events-none">
            <span className="text-4xl">🔇</span>
          </div>
        )}
      </div>

      <CommentsDrawer
        postId={post.id}
        userId={userId}
        isOpen={commentsOpen}
        onClose={() => {
          setCommentsOpen(false);
          if (!hasCommentedRef.current && userId) {
            hasCommentedRef.current = true;
            sendImpression({ commented: true });
          }
        }}
      />

      <ReportDialog
        postId={post.id}
        userId={userId}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
