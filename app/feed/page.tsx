'use client';

import { useEffect, useState } from 'react';
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
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Video Feed</h1>
          {user && (
            <Link
              href="/upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload Video
            </Link>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              No posts yet. Be the first to share a video!
            </p>
            {user && (
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upload Video
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-black">
                  <video
                    src={post.video_url}
                    className="w-full h-full object-contain"
                    controls
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      {post.profiles.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt={post.profiles.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {post.profiles.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold">{post.profiles.username}</span>
                  </div>
                  
                  {post.caption && (
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {post.caption}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>❤️ {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    <span className="ml-auto">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
