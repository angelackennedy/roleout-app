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

    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        setLiked(false);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });
        setLiked(true);
      }
      fetchPost();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content: newComment.trim(),
        });

      setNewComment('');
      fetchComments();
      fetchPost();
    } catch (error) {
      console.error('Error posting comment:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/feed" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Feed
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={post.video_url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  liked ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {liked ? '❤️' : '🤍'} {post.like_count}
              </button>

              <button
                onClick={handleFlag}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                🚩 Flag
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                  {post.profiles.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt={post.profiles.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-semibold">
                      {post.profiles.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <Link
                    href={`/profile/${post.user_id}`}
                    className="font-semibold hover:text-blue-600"
                  >
                    {post.profiles.username}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {post.caption && (
                <p className="text-gray-700 dark:text-gray-300">{post.caption}</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Comments ({post.comment_count})</h3>

              {user && (
                <form onSubmit={handleComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Post
                  </button>
                </form>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 dark:border-gray-800 pl-3">
                    <p className="font-semibold text-sm">{comment.profiles.username}</p>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
