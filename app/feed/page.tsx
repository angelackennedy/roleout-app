"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MODE, PAGE_SIZE } from "@/lib/config";
import { initLocalDB, listPosts, likePost, listComments, addComment, commentsChannel } from "@/lib/localdb";
import { useAuth } from "@/lib/auth-context";

let supabase: any = null;
if (MODE === "supabase") {
  const supabaseModule = require("@/lib/supabase");
  supabase = supabaseModule.supabase;
}

interface LocalPost {
  id: string;
  kind: "image" | "video";
  caption?: string;
  created_at: string;
  likes: number;
  comments_count: number;
  objectUrl: string;
}

interface SupabasePost {
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

type Post = LocalPost | SupabasePost;

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user?: string;
  user_id?: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

function CommentDrawer({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (MODE === "local") {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "comment" && event.data.postId === postId) {
          setComments((prev) => [...prev, event.data.comment]);
        }
      };

      commentsChannel.addEventListener("message", handleMessage);
      return () => {
        commentsChannel.removeEventListener("message", handleMessage);
      };
    } else if (MODE === "supabase") {
      const channel = supabase
        .channel(`comments:${postId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `post_id=eq.${postId}`,
          },
          async (payload: any) => {
            const { data: newCommentData } = await supabase
              .from("comments")
              .select("*, profiles(username, avatar_url)")
              .eq("id", payload.new.id)
              .single();

            if (newCommentData) {
              setComments((prev) => [...prev, newCommentData]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      if (MODE === "local") {
        const data = await listComments(postId);
        setComments(data);
      } else if (MODE === "supabase") {
        const { data, error } = await supabase
          .from("comments")
          .select("*, profiles(username, avatar_url)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setComments(data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const body = newComment.trim();

    try {
      if (MODE === "local") {
        await addComment(postId, body, "LocalUser");
        setNewComment("");
      } else if (MODE === "supabase") {
        if (!user) return;

        const { error } = await supabase.from("comments").insert({
          user_id: user.id,
          post_id: postId,
          body,
        });

        if (error) throw error;

        await supabase
          .from("posts")
          .update({ comment_count: comments.length + 1 })
          .eq("id", postId);

        setNewComment("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentUsername = (comment: Comment) => {
    if (MODE === "local") {
      return comment.user || "LocalUser";
    }
    return comment.profiles?.username || "User";
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 999,
          backdropFilter: "blur(4px)",
        }}
      />

      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 360,
          background: "#1a1a1a",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontSize: 18 }}>
            Comments ({comments.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 24,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  paddingLeft: 12,
                  borderLeft: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div
                    className="avatar"
                    style={{ width: 24, height: 24, fontSize: 12 }}
                  >
                    {getCommentUsername(comment)[0].toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "white",
                    }}
                  >
                    {getCommentUsername(comment)}
                  </div>
                </div>
                <p
                  style={{
                    margin: "0 0 6px 0",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {comment.body}
                </p>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {new Date(comment.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {(MODE === "local" || user) ? (
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "20px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              gap: 10,
            }}
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={submitting}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="nav-btn"
              style={{
                padding: "10px 20px",
                opacity: !newComment.trim() || submitting ? 0.5 : 1,
                cursor: !newComment.trim() || submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "..." : "Post"}
            </button>
          </form>
        ) : (
          <div
            style={{
              padding: "20px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
              color: "rgba(255,255,255,0.6)",
              fontSize: 14,
            }}
          >
            <Link href="/auth/login" className="nav-btn">
              Sign in to comment
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentDrawerPostId, setCommentDrawerPostId] = useState<string | null>(
    null
  );
  const [likeAnimations, setLikeAnimations] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const lastPostRef = useRef<HTMLDivElement>(null);
  const paginationObserverRef = useRef<IntersectionObserver | null>(null);
  const viewportObserverRef = useRef<IntersectionObserver | null>(null);
  const postRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const videoRefsMap = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    fetchPosts();
    if (MODE === "supabase" && user) fetchUserLikes();
  }, [user]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    paginationObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(true);
        }
      },
      { threshold: 0.8 }
    );

    if (lastPostRef.current) {
      paginationObserverRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (paginationObserverRef.current) {
        paginationObserverRef.current.disconnect();
      }
    };
  }, [posts, hasMore, loadingMore]);

  useEffect(() => {
    viewportObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;

          const postElement = entry.target as HTMLDivElement;
          const videoElement = videoRefsMap.current.get(postId);

          if (entry.isIntersecting) {
            postElement.classList.add("inview");
            if (videoElement) {
              videoElement.play().catch(() => {});
            }
          } else {
            postElement.classList.remove("inview");
            if (videoElement) {
              videoElement.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    postRefsMap.current.forEach((element) => {
      if (viewportObserverRef.current) {
        viewportObserverRef.current.observe(element);
      }
    });

    return () => {
      if (viewportObserverRef.current) {
        viewportObserverRef.current.disconnect();
      }
    };
  }, [posts]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && commentDrawerPostId) {
        setCommentDrawerPostId(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [commentDrawerPostId]);

  const fetchUserLikes = async () => {
    if (MODE !== "supabase" || !user) return;

    try {
      const { data } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (data) {
        setLikedPosts(new Set(data.map((like: any) => like.post_id)));
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

      if (MODE === "local") {
        await initLocalDB();
        const data = await listPosts(currentOffset, PAGE_SIZE);

        if (loadMore) {
          setPosts((prev) => [...prev, ...data]);
          setOffset(currentOffset + PAGE_SIZE);
        } else {
          setPosts(data);
          setOffset(PAGE_SIZE);
        }

        setHasMore(data.length === PAGE_SIZE);
      } else if (MODE === "supabase") {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `
            *,
            profiles (username, avatar_url)
          `
          )
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + PAGE_SIZE - 1);

        if (error) throw error;

        if (loadMore) {
          setPosts((prev) => [...prev, ...(data || [])]);
          setOffset(currentOffset + PAGE_SIZE);
        } else {
          setPosts(data || []);
          setOffset(PAGE_SIZE);
        }

        setHasMore((data || []).length === PAGE_SIZE);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const triggerLikeAnimation = (postId: string) => {
    setLikeAnimations((prev) => new Set(prev).add(postId));
    setTimeout(() => {
      setLikeAnimations((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }, 400);
  };

  const handleLike = async (
    e: React.MouseEvent,
    postId: string,
    currentCount: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    triggerLikeAnimation(postId);

    if (MODE === "local") {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isLocal = "kind" in p;
            if (isLocal) {
              return { ...p, likes: p.likes + 1 };
            }
          }
          return p;
        })
      );

      try {
        await likePost(postId);
      } catch (error) {
        console.error("Like failed:", error);
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              const isLocal = "kind" in p;
              if (isLocal) {
                return { ...p, likes: Math.max(0, p.likes - 1) };
              }
            }
            return p;
          })
        );
      }
    } else if (MODE === "supabase") {
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
        prev.map((p) => {
          const isSupabase = "like_count" in p;
          if (p.id === postId && isSupabase) {
            return { ...p, like_count: newCount };
          }
          return p;
        })
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
          prev.map((p) => {
            const isSupabase = "like_count" in p;
            if (p.id === postId && isSupabase) {
              return { ...p, like_count: currentCount };
            }
            return p;
          })
        );
      }
    }
  };

  const handleOpenComments = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentDrawerPostId(postId);
  };

  const getPostMediaUrl = (post: Post) => {
    if ("kind" in post) {
      return post.objectUrl;
    }
    return post.video_url || post.image_url || "";
  };

  const isVideo = (post: Post) => {
    if ("kind" in post) {
      return post.kind === "video";
    }
    return !!post.video_url;
  };

  const getPostCaption = (post: Post) => {
    if ("kind" in post) {
      return post.caption || "";
    }
    return post.caption || "";
  };

  const getPostLikeCount = (post: Post) => {
    if ("kind" in post) {
      return post.likes;
    }
    return post.like_count;
  };

  const getPostCommentCount = (post: Post) => {
    if ("kind" in post) {
      return post.comments_count;
    }
    return post.comment_count;
  };

  const getUsername = (post: Post) => {
    if ("kind" in post) {
      return "LocalUser";
    }
    return post.profiles?.username || "User";
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)",
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
          background: "radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)",
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
    <>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 50%, #000 100%)
            `,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.6) 100%)
            `,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            height: "100dvh",
            overflow: "auto",
            scrollSnapType: "y mandatory",
            zIndex: 2,
          }}
        >
          {posts.map((post, index) => {
            const isLiked = likedPosts.has(post.id);
            const isLastPost = index === posts.length - 1;
            const mediaUrl = getPostMediaUrl(post);
            const postIsVideo = isVideo(post);
            const hasLikeAnimation = likeAnimations.has(post.id);

            return (
              <div
                key={post.id}
                ref={(el) => {
                  if (el) {
                    postRefsMap.current.set(post.id, el);
                  }
                  if (isLastPost && el) {
                    lastPostRef.current = el;
                  }
                }}
                data-post-id={post.id}
                className="postFrame"
                style={{
                  scrollSnapAlign: "start",
                  minHeight: "100dvh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "min(100%, 600px)",
                    height: "calc(100dvh - 40px)",
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: `
                      0 20px 60px rgba(0,0,0,0.8),
                      0 0 0 1px rgba(255,255,255,0.05),
                      0 0 40px rgba(212, 175, 55, 0.1)
                    `,
                  }}
                >
                  <Link
                    href={MODE === "local" ? "#" : `/post/${post.id}`}
                    onClick={(e) => MODE === "local" && e.preventDefault()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      textDecoration: "none",
                      color: "inherit",
                      position: "relative",
                    }}
                  >
                    {postIsVideo ? (
                      <video
                        ref={(el) => {
                          if (el) {
                            videoRefsMap.current.set(post.id, el);
                          }
                        }}
                        src={mediaUrl}
                        loop
                        playsInline
                        muted
                        preload="metadata"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={getPostCaption(post)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}

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
                        onClick={(e) => handleLike(e, post.id, getPostLikeCount(post))}
                        className="actionBtn"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 50,
                          width: 56,
                          height: 56,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          className={hasLikeAnimation ? "likeIcon" : ""}
                          style={{ fontSize: 24, lineHeight: 1 }}
                        >
                          {isLiked ? "❤️" : "🤍"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                          {getPostLikeCount(post)}
                        </span>
                      </button>

                      <button
                        onClick={(e) => handleOpenComments(e, post.id)}
                        className="actionBtn"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 50,
                          width: 56,
                          height: 56,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span style={{ fontSize: 24, lineHeight: 1 }}>💬</span>
                        <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                          {getPostCommentCount(post)}
                        </span>
                      </button>

                      <button
                        className="actionBtn"
                        onClick={(e) => e.preventDefault()}
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 50,
                          width: 56,
                          height: 56,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span style={{ fontSize: 24, lineHeight: 1 }}>⋯</span>
                      </button>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "30px 20px 20px 20px",
                        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                        color: "white",
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
                          {getUsername(post)[0].toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {getUsername(post)}
                        </div>
                      </div>
                      {getPostCaption(post) && (
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, opacity: 0.95 }}>
                          {getPostCaption(post)}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}

          {loadingMore && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Loading more...
            </div>
          )}
        </div>
      </div>

      {commentDrawerPostId && (
        <CommentDrawer
          postId={commentDrawerPostId}
          onClose={() => setCommentDrawerPostId(null)}
        />
      )}

      <style jsx global>{`
        @keyframes inFade {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pop {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.18);
          }
          100% {
            transform: scale(1);
          }
        }

        .postFrame {
          opacity: 0;
          transform: translateY(20px) scale(0.98);
          transition: all 0.3s ease;
        }

        .postFrame.inview {
          animation: inFade 0.5s ease forwards;
        }

        .actionBtn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
          border-color: rgba(212, 175, 55, 0.5);
        }

        .likeIcon {
          animation: pop 0.4s ease;
        }
      `}</style>
    </>
  );
}
