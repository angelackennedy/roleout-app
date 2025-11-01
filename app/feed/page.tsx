"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Post {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  // ❤️ Like handler
  async function handleLike(postId: string, current: number) {
    // 1. Update on-screen instantly
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, like_count: current + 1 } : p,
      ),
    );

    // 2. Save change in Supabase
    const { error } = await supabase
      .from("posts")
      .update({ like_count: current + 1 })
      .eq("id", postId);

    // 3. If it fails, undo the change
    if (error) {
      console.error("Like failed:", error);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, like_count: current } : p)),
      );
    }
  }
  useEffect(() => {
    fetchPosts();
  }, []);
  const [flashId, setFlashId] = useState<string | null>(null);
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, avatar_url)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- REPLACE LINES 50–143 WITH THIS ---

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
      {/* Hero */}
      <section className="hero" style={{ paddingBottom: 10 }}>
        <h1>Feed</h1>
        <p>Browse recent video posts.</p>
      </section>

      {/* Toolbar */}
      <div className="feed-toolbar">
        <span className="pill pill-active">All</span>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/upload" className="nav-btn">
            + Upload
          </Link>
        </div>
      </div>

      {/* Posts */}
      <section className="feed-list">
        {posts.length === 0 ? (
          <p style={{ opacity: 0.85 }}>
            No posts yet — be the first to share a video!
          </p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="post card"
              tabIndex={0}
            >
              {/* Header */}
              <header className="post-header">
                <div className="avatar" aria-hidden="true">
                  {/* If you later have avatars, swap this to an <img src={post.profiles.avatar_url} /> */}
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

              {/* Caption */}
              {post.caption && <p className="post-text">{post.caption}</p>}

              {/* Video */}
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

              {/* Footer */}
              {/* Footer */}
              <footer className="post-footer">
                <button
                  className={`nav-btn ${flashId === post.id ? "flash" : ""}`}
                  onClick={(e) => {
                    e.preventDefault(); // stops navigation when clicking inside the post
                    setFlashId(post.id); // start gold flash
                    handleLike(post.id, post.like_count); // update like count
                    setTimeout(() => setFlashId(null), 500); // stop flash after 0.5 s
                  }}
                >
                  ❤️ {post.like_count}
                </button>

                <button className="nav-btn outline">
                  💬 {post.comment_count}
                </button>

                <div className="spacer" />

                <button className="nav-btn outline">⋯</button>
              </footer>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
