'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Post {
  id: string;
  video_url: string;
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchPost();
    fetchComments();
    if (user) checkLiked();
  }, [postId, user]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkLiked = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      setLiked(!!data);
    } catch (error) {
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!post) return;

    const wasLiked = liked;
    const newCount = wasLiked ? post.like_count - 1 : post.like_count + 1;

    setLiked(!wasLiked);
    setPost({ ...post, like_count: newCount });

    try {
      let likeError;
      
      if (wasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        likeError = error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });
        likeError = error;
      }

      if (likeError) throw likeError;

      const { error: updateError } = await supabase
        .from('posts')
        .update({ like_count: newCount })
        .eq('id', postId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error toggling like:', error);
      setLiked(wasLiked);
      setPost({ ...post, like_count: post.like_count });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const optimisticComment: Comment = {
      id: 'temp-' + Date.now(),
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: {
        username: user.email?.split('@')[0] || 'User',
      },
    };

    setComments([...comments, optimisticComment]);
    setNewComment('');

    if (post) {
      setPost({ ...post, comment_count: post.comment_count + 1 });
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content: optimisticComment.content,
        });

      if (error) throw error;

      await supabase
        .from('posts')
        .update({ comment_count: (post?.comment_count || 0) + 1 })
        .eq('id', postId);

      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      setComments(comments);
      if (post) {
        setPost({ ...post, comment_count: post.comment_count });
      }
    }
  };

  const handleFlag = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const reason = prompt('Why are you flagging this post?');
    if (!reason) return;

    try {
      await supabase
        .from('flags')
        .insert({
          user_id: user.id,
          post_id: postId,
          reason,
        });

      alert('Post flagged for review. Thank you for helping keep RollCall safe!');
    } catch (error) {
      console.error('Error flagging post:', error);
      alert('Failed to flag post. Please try again.');
    }
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
          <Link href="/feed" className="nav-btn">← Back to Feed</Link>
        </section>
      </main>
    );
  }

  const isVideo = post.video_url.match(/\.(mp4|webm|mov)$/i);

  return (
    <main className="container">
      <div style={{ marginBottom: 20 }}>
        <Link href="/feed" className="nav-btn outline">
          ← Back to Feed
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 30, maxWidth: 900 }}>
        <div className="card">
          {isVideo ? (
            <video
              src={post.video_url}
              controls
              autoPlay
              loop
              style={{ width: '100%', borderRadius: 10, backgroundColor: '#000' }}
            />
          ) : (
            <img
              src={post.video_url}
              alt={post.caption || 'Post'}
              style={{ width: '100%', borderRadius: 10 }}
            />
          )}

          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleLike}
              className="nav-btn"
              style={liked ? { color: 'var(--accent-gold)' } : {}}
            >
              {liked ? '❤️' : '🤍'} {post.like_count}
            </button>

            <button className="nav-btn outline">
              💬 {post.comment_count}
            </button>

            <div style={{ marginLeft: 'auto' }}>
              <button onClick={handleFlag} className="nav-btn outline">
                🚩 Flag
              </button>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div className="avatar" style={{ width: 40, height: 40 }}>
                {post.profiles.username[0].toUpperCase()}
              </div>
              <div>
                <Link
                  href={`/profile/${post.user_id}`}
                  style={{ fontWeight: 600 }}
                >
                  {post.profiles.username}
                </Link>
                <div style={{ fontSize: '0.9em', opacity: 0.7 }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {post.caption && (
              <p style={{ marginTop: 10 }}>{post.caption}</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Comments ({post.comment_count})</h3>

          {user && (
            <form onSubmit={handleComment} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'inherit',
                }}
              />
              <button type="submit" className="nav-btn">
                Post
              </button>
            </form>
          )}

          <div style={{ display: 'grid', gap: 15 }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  paddingLeft: 15,
                  borderLeft: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95em' }}>
                  {comment.profiles.username}
                </div>
                <p style={{ marginTop: 5 }}>{comment.content}</p>
                <div style={{ fontSize: '0.85em', opacity: 0.6, marginTop: 5 }}>
                  {new Date(comment.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
