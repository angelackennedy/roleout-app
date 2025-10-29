import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvepvyihbgvwhxmnhogp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZXB2eWloYmd2d2h4bW5ob2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTc5NDgsImV4cCI6MjA3NzMzMzk0OH0.2FPQ5ykrXr6lnEpn-lqrB2r4xGlk3m8TdGZcHBYhQtc';

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
