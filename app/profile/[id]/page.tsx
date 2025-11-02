'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MODE } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';

let supabase: any = null;
if (MODE === "supabase") {
  const supabaseModule = require('@/lib/supabase');
  supabase = supabaseModule.supabase;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Post {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (MODE === "supabase") {
      fetchProfile();
      fetchUserPosts();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (MODE !== "supabase") return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (MODE !== "supabase") return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-3xl">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="font-bold">
                  {profile.username[0].toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
              )}
              <div className="flex gap-6 text-sm text-gray-500">
                <span>{posts.length} posts</span>
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isOwnProfile ? 'Your Videos' : 'Videos'}
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {isOwnProfile ? "You haven't posted any videos yet" : 'No videos posted yet'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/upload"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload Your First Video
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group relative aspect-video bg-black rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <video
                    src={post.video_url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="flex items-center gap-3 text-sm">
                        <span>❤️ {post.like_count}</span>
                        <span>💬 {post.comment_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
