import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
          video_url: string;
          caption: string | null;
          created_at: string;
          like_count: number;
          comment_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_url: string;
          caption?: string | null;
          created_at?: string;
          like_count?: number;
          comment_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_url?: string;
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
    };
  };
};
