"use client";

import { useEffect, useState } from "react";
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
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    if (user) fetchUserLikes();
  }, [user]);

  const fetchUserLikes = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);
      
      if (data) {
        setLikedPosts(new Set(data.map(like => like.post_id)));
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
        `,
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

  const handleLike = async (postId: string, currentCount: number) => {
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
      prev.map((p) =>
        p.id === postId ? { ...p, like_count: newCount } : p,
      ),
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
        prev.map((p) => (p.id === postId ? { ...p, like_count: currentCount } : p)),
      );
    }
  };

  if (loading) {
    return (
      <main className="container">
        <section className="hero" style={{ paddingBottom: 10 }}>
          <h1>Feed</h1>
          <p>Loading feed…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 10 }}>
        <h1>Feed</h1>
        <p>Browse recent posts.</p>
      </section>

      <div className="feed-toolbar">
        <span className="pill pill-active">All</span>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/upload" className="nav-btn">
            + Upload
          </Link>
        </div>
      </div>

      <section className="feed-list">
        {posts.length === 0 ? (
          <p style={{ opacity: 0.85 }}>
            No posts yet — be the first to share!
          </p>
        ) : (
          <>
            {posts.map((post) => {
              const isLiked = likedPosts.has(post.id);
              
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="post card"
                  tabIndex={0}
                >
                  <header className="post-header">
                    <div className="avatar" aria-hidden="true">
                      {(post.profiles?.username?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <div className="post-author">
                        {post.profiles?.username || "User"}
                      </div>
                      <div className="muted">
                        {new Date(post.created_at).toLocaleString()}
                      </div>
                    </div>
                  </header>

                  {post.caption && <p className="post-text">{post.caption}</p>}

                  {post.video_url && (
                    <div className="post-media">
                      <video
                        controls
                        src={post.video_url}
                        preload="metadata"
                        style={{ width: "100%", borderRadius: 10, outline: "none" }}
                      />
                    </div>
                  )}

                  {post.image_url && (
                    <div className="post-media">
                      <img
                        src={post.image_url}
                        alt={post.caption || "Post image"}
                        style={{ width: "100%", borderRadius: 10 }}
                      />
                    </div>
                  )}

                  <footer className="post-footer">
                    <button
                      className={`nav-btn ${flashId === post.id ? "flash" : ""} ${isLiked ? "liked" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setFlashId(post.id);
                        handleLike(post.id, post.like_count);
                        setTimeout(() => setFlashId(null), 500);
                      }}
                      style={isLiked ? { color: "var(--accent-gold)" } : {}}
                    >
                      {isLiked ? "❤️" : "🤍"} {post.like_count}
                    </button>

                    <button className="nav-btn outline">
                      💬 {post.comment_count}
                    </button>

                    <div className="spacer" />

                    <button className="nav-btn outline">⋯</button>
                  </footer>
                </Link>
              );
            })}
            
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 30 }}>
                <button
                  onClick={() => fetchPosts(true)}
                  disabled={loadingMore}
                  className="nav-btn"
                  style={{
                    padding: "12px 30px",
                    opacity: loadingMore ? 0.5 : 1
                  }}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
