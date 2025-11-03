import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Runtime diagnostics for Supabase configuration
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] URL:', supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'MISSING');
  console.log('[Supabase Client] Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...****` : 'MISSING');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)






export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          video_url: string | null;
          image_url: string | null;
          caption: string | null;
          created_at: string;
          like_count: number;
          comment_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_url?: string | null;
          image_url?: string | null;
          caption?: string | null;
          created_at?: string;
          like_count?: number;
          comment_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_url?: string | null;
          image_url?: string | null;
          caption?: string | null;
          created_at?: string;
          like_count?: number;
          comment_count?: number;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      moderation_actions: {
        Row: {
          id: string;
          moderator_id: string;
          post_id: string | null;
          action_type: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          post_id?: string | null;
          action_type: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          post_id?: string | null;
          action_type?: string;
          reason?: string;
          created_at?: string;
        };
      };
      flags: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          reason: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          reason: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          reason?: string;
          status?: string;
          created_at?: string;
        };
      };
      live_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_live: boolean;
          started_at: string;
          ended_at: string | null;
          viewers: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          is_live?: boolean;
          started_at?: string;
          ended_at?: string | null;
          viewers?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          is_live?: boolean;
          started_at?: string;
          ended_at?: string | null;
          viewers?: number;
        };
      };
    };
  };
};
