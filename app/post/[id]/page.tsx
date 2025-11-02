"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MODE } from "@/lib/config";
import { initLocalDB, getPost, listComments, addComment, commentsChannel, likePost } from "@/lib/localdb";
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
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

type Post = LocalPost | SupabasePost;

interface LocalComment {
  id: string;
  body: string;
  user: string;
  created_at: string;
}

interface SupabaseComment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

type Comment = LocalComment | SupabaseComment;

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchPost();
    fetchComments();
    if (MODE === "supabase" && user) checkLiked();
  }, [postId, user]);

  useEffect(() => {
    if (MODE === "local") {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "comment" && event.data.postId === postId) {
          setComments((prev) => [...prev, event.data.comment]);
          setPost((prev) => {
            if (prev && "kind" in prev) {
              return { ...prev, comments_count: prev.comments_count + 1 };
            }
            return prev;
          });
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
              setPost((prev) => {
                if (prev && "like_count" in prev) {
                  return { ...prev, comment_count: prev.comment_count + 1 };
                }
                return prev;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      if (MODE === "local") {
        await initLocalDB();
        const data = await getPost(postId);
        setPost(data);
      } else if (MODE === "supabase") {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `
            *,
            profiles (username, avatar_url)
          `
          )
          .eq("id", postId)
          .single();

        if (error) throw error;
        setPost(data);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      if (MODE === "local") {
        await initLocalDB();
        const data = await listComments(postId);
        setComments(data);
      } else if (MODE === "supabase") {
        const { data, error } = await supabase
          .from("comments")
          .select(
            `
            *,
            profiles (username, avatar_url)
          `
          )
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setComments(data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkLiked = async () => {
    if (MODE !== "supabase" || !user) return;

    try {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

      setLiked(!!data);
    } catch (error) {
      setLiked(false);
    }
  };

  const handleLike = async () => {
    if (MODE === "local") {
      setPost((prev) => {
        if (prev && "kind" in prev) {
          return { ...prev, likes: prev.likes + 1 };
        }
        return prev;
      });

      try {
        await likePost(postId);
      } catch (error) {
        console.error("Error liking post:", error);
        setPost((prev) => {
          if (prev && "kind" in prev) {
            return { ...prev, likes: Math.max(0, prev.likes - 1) };
          }
          return prev;
        });
      }
    } else if (MODE === "supabase") {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      if (!post || !("like_count" in post)) return;

      const wasLiked = liked;
      const newCount = wasLiked ? post.like_count - 1 : post.like_count + 1;

      setLiked(!wasLiked);
      setPost({ ...post, like_count: newCount });

      try {
        let likeError;

        if (wasLiked) {
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
        console.error("Error toggling like:", error);
        setLiked(wasLiked);
        setPost({ ...post, like_count: post.like_count });
      }
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const body = newComment.trim();

    try {
      if (MODE === "local") {
        await addComment(postId, body, "You");
        setNewComment("");
      } else if (MODE === "supabase") {
        if (!user) return;

        const { error } = await supabase.from("comments").insert({
          user_id: user.id,
          post_id: postId,
          body,
        });

        if (error) throw error;

        setNewComment("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = async () => {
    if (MODE === "local") {
      alert("Flag feature not available in local mode");
      return;
    }

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const reason = prompt("Why are you flagging this post?");
    if (!reason) return;

    try {
      const { error } = await supabase.from("flags").insert({
        user_id: user.id,
        post_id: postId,
        reason,
      });

      if (error) throw error;

      alert(
        "Post flagged for review. Thank you for helping keep RollCall safe!"
      );
    } catch (error) {
      console.error("Error flagging post:", error);
      alert("Failed to flag post. Please try again.");
    }
  };

  const getMediaUrl = () => {
    if (!post) return "";
    if ("kind" in post) return post.objectUrl;
    return post.video_url || post.image_url || "";
  };

  const isVideo = () => {
    if (!post) return false;
    if ("kind" in post) return post.kind === "video";
    return !!post.video_url;
  };

  const getCaption = () => {
    if (!post) return "";
    if ("kind" in post) return post.caption || "";
    return post.caption || "";
  };

  const getLikeCount = () => {
    if (!post) return 0;
    if ("kind" in post) return post.likes;
    return post.like_count;
  };

  const getCommentCount = () => {
    if (!post) return 0;
    if ("kind" in post) return post.comments_count;
    return post.comment_count;
  };

  const getUsername = () => {
    if (!post) return "User";
    if ("kind" in post) return "LocalUser";
    return post.profiles?.username || "User";
  };

  const getUserId = () => {
    if (!post) return "";
    if ("kind" in post) return "";
    return post.user_id;
  };

  const getCommentUsername = (comment: Comment) => {
    if ("user" in comment) return comment.user;
    return comment.profiles?.username || "User";
  };

  if (loading) {
    return (
      <main className="container">
        <section className="hero">
          <p>Loading post...</p>
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="container">
        <section className="hero">
          <h1>Post not found</h1>
          <Link href="/feed" className="nav-btn">
            ← Back to Feed
          </Link>
        </section>
      </main>
    );
  }

  const mediaUrl = getMediaUrl();
  const postIsVideo = isVideo();

  return (
    <main className="container">
      <div style={{ marginBottom: 20 }}>
        <Link href="/feed" className="nav-btn outline">
          ← Back to Feed
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 30,
          maxWidth: 900,
        }}
      >
        <div className="card">
          {postIsVideo ? (
            <video
              src={mediaUrl}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                borderRadius: 10,
                backgroundColor: "#000",
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={getCaption()}
              style={{ width: "100%", borderRadius: 10 }}
            />
          )}

          <div
            style={{ marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}
          >
            <button
              onClick={handleLike}
              className="nav-btn"
              style={liked ? { color: "var(--accent-gold)" } : {}}
            >
              {liked ? "❤️" : "🤍"} {getLikeCount()}
            </button>

            <button className="nav-btn outline">
              💬 {getCommentCount()}
            </button>

            {MODE === "supabase" && (
              <div style={{ marginLeft: "auto" }}>
                <button onClick={handleFlag} className="nav-btn outline">
                  🚩 Flag
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div className="avatar" style={{ width: 40, height: 40 }}>
                {getUsername()[0].toUpperCase()}
              </div>
              <div>
                {MODE === "supabase" && getUserId() ? (
                  <Link
                    href={`/profile/${getUserId()}`}
                    style={{ fontWeight: 600 }}
                  >
                    {getUsername()}
                  </Link>
                ) : (
                  <div style={{ fontWeight: 600 }}>{getUsername()}</div>
                )}
                <div style={{ fontSize: "0.9em", opacity: 0.7 }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {getCaption() && <p style={{ marginTop: 10 }}>{getCaption()}</p>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20 }}>
            Comments ({getCommentCount()})
          </h3>

          {(MODE === "local" || user) && (
            <form
              onSubmit={handleComment}
              style={{ display: "flex", gap: 10, marginBottom: 20 }}
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "inherit",
                }}
              />
              <button
                type="submit"
                className="nav-btn"
                disabled={!newComment.trim() || submitting}
                style={{ opacity: !newComment.trim() || submitting ? 0.5 : 1 }}
              >
                {submitting ? "..." : "Post"}
              </button>
            </form>
          )}

          <div style={{ display: "grid", gap: 15 }}>
            {comments.length === 0 ? (
              <p className="muted">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    paddingLeft: 15,
                    borderLeft: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.95em" }}>
                    {getCommentUsername(comment)}
                  </div>
                  <p style={{ marginTop: 5 }}>{comment.body}</p>
                  <div
                    style={{ fontSize: "0.85em", opacity: 0.6, marginTop: 5 }}
                  >
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
