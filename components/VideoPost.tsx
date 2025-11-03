'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
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
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
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

export default function VideoPost({ post, isActive, userId = null }: VideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLiked, likeCount, toggleLike, isLoading } = usePostLike({
    postId: post.id,
    initialLikeCount: post.like_count,
    userId,
  });

  const username = hasNestedProfile(post) ? post.profiles.username : post.username;
  const displayName = hasNestedProfile(post) ? post.profiles.display_name : post.display_name;
  const avatarUrl = hasNestedProfile(post) ? post.profiles.avatar_url : post.avatar_url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100%',
      scrollSnapAlign: 'start',
      background: '#000',
    }}>
      <video
        ref={videoRef}
        src={post.video_url}
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }}>
        <Link
          href={`/u/${username}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            textDecoration: 'none',
            color: 'white',
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: avatarUrl
              ? `url(${avatarUrl}) center/cover`
              : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
          }}>
            {!avatarUrl && username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {displayName || username}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              @{username}
            </div>
          </div>
        </Link>

        {post.caption && (
          <div style={{
            fontSize: 14,
            lineHeight: 1.4,
            marginBottom: 8,
            color: 'white',
          }}>
            {post.caption}
          </div>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}>
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                style={{
                  fontSize: 13,
                  color: 'rgba(212,175,55,0.9)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        right: 16,
        bottom: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <button 
          onClick={toggleLike}
          disabled={isLoading}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid white',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            flexDirection: 'column',
            opacity: isLoading ? 0.6 : 1,
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => {
            if (!isLoading) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)';
            }
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: 'white' }}>
            {likeCount}
          </span>
        </button>

        <button 
          onClick={() => setCommentsOpen(true)}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid white',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: 'pointer',
            flexDirection: 'column',
          }}
        >
          <span>💬</span>
          <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: 'white' }}>
            {post.comment_count}
          </span>
        </button>

        <button style={{
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid white',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          cursor: 'pointer',
          flexDirection: 'column',
        }}>
          <span>↗️</span>
          <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: 'white' }}>
            {post.share_count}
          </span>
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '2px solid white',
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              cursor: 'pointer',
              color: 'white',
            }}
          >
            ⋯
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 64,
                top: 0,
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                borderRadius: 12,
                padding: 8,
                minWidth: 150,
                border: '2px solid rgba(212,175,55,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                🚩 Report
              </button>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/upload"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(212,175,55,0.8)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: 30,
          padding: '10px 20px',
          color: 'white',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 18 }}>+</span>
        Upload
      </Link>

      <CommentsDrawer
        postId={post.id}
        userId={userId}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
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
