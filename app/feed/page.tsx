"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Post {
  id: string;
  video_url: string | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const POSTS_PER_PAGE = 10;

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const lastPostRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchPosts();
    if (user) fetchUserLikes();
  }, [user]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(true);
        }
      },
      { threshold: 0.8 }
    );

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [posts, hasMore, loadingMore]);

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (data) {
        setLikedPosts(new Set(data.map((like) => like.post_id)));
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const fetchPosts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentOffset = loadMore ? offset : 0;

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, avatar_url)
        `
        )
        .order("created_at", { ascending: false })
        .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1);

      if (error) throw error;

      if (loadMore) {
        setPosts((prev) => [...prev, ...(data || [])]);
        setOffset(currentOffset + POSTS_PER_PAGE);
      } else {
        setPosts(data || []);
        setOffset(POSTS_PER_PAGE);
      }

      setHasMore((data || []).length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (
    e: React.MouseEvent,
    postId: string,
    currentCount: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    const isLiked = likedPosts.has(postId);
    const newCount = isLiked ? currentCount - 1 : currentCount + 1;

    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, like_count: newCount } : p))
    );

    try {
      let likeError;

      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        likeError = error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, post_id: postId });
        likeError = error;
      }

      if (likeError) throw likeError;

      const { error: updateError } = await supabase
        .from("posts")
        .update({ like_count: newCount })
        .eq("id", postId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Like failed:", error);

      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, like_count: currentCount } : p
        )
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#000",
          color: "white",
        }}
      >
        <p>Loading feed…</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#000",
          color: "white",
          textAlign: "center",
          padding: 20,
        }}
      >
        <div>
          <p style={{ marginBottom: 20 }}>No posts yet — be the first to share!</p>
          <Link href="/upload" className="nav-btn">
            + Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100dvh",
        overflow: "auto",
        scrollSnapType: "y mandatory",
        background: "#000",
      }}
    >
      {posts.map((post, index) => {
        const isLiked = likedPosts.has(post.id);
        const isLastPost = index === posts.length - 1;

        return (
          <div
            key={post.id}
            ref={isLastPost ? lastPostRef : null}
            style={{
              scrollSnapAlign: "start",
              minHeight: "100dvh",
              display: "grid",
              placeItems: "center",
              position: "relative",
              background: "#000",
            }}
          >
            <Link
              href={`/post/${post.id}`}
              style={{
                display: "grid",
                placeItems: "center",
                width: "100%",
                height: "100%",
                textDecoration: "none",
                color: "inherit",
                position: "relative",
              }}
            >
              {post.video_url && (
                <video
                  src={post.video_url}
                  controls
                  playsInline
                  muted
                  preload="metadata"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100dvh",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.caption || "Post"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100dvh",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: 60,
                  left: 20,
                  right: 80,
                  color: "white",
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    className="avatar"
                    style={{ width: 32, height: 32, fontSize: 14 }}
                  >
                    {(post.profiles?.username?.[0] || "U").toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {post.profiles?.username || "User"}
                  </div>
                </div>
                {post.caption && (
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                    {post.caption}
                  </p>
                )}
              </div>

              <div
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={(e) => handleLike(e, post.id, post.like_count)}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    borderRadius: "50%",
                    width: 56,
                    height: 56,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isLiked ? "var(--accent-gold)" : "white",
                    cursor: "pointer",
                    fontSize: 24,
                    backdropFilter: "blur(10px)",
                    transition: "transform 0.2s",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.9)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <span>{isLiked ? "❤️" : "🤍"}</span>
                  <span style={{ fontSize: 12, marginTop: 2 }}>
                    {post.like_count}
                  </span>
                </button>

                <button
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    borderRadius: "50%",
                    width: 56,
                    height: 56,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 24,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span>💬</span>
                  <span style={{ fontSize: 12, marginTop: 2 }}>
                    {post.comment_count}
                  </span>
                </button>

                <button
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    borderRadius: "50%",
                    width: 56,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 24,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  ⋯
                </button>
              </div>
            </Link>
          </div>
        );
      })}

      {loadingMore && (
        <div
          style={{
            scrollSnapAlign: "start",
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            color: "white",
          }}
        >
          <p>Loading more...</p>
        </div>
      )}
    </div>
  );
}
