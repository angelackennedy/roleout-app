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
          hashtags: string[] | null;
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
          hashtags?: string[] | null;
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
          hashtags?: string[] | null;
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
      algorithm_weights: {
        Row: {
          id: string;
          likes_weight: number;
          comments_weight: number;
          watch_completion_weight: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          likes_weight?: number;
          comments_weight?: number;
          watch_completion_weight?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          likes_weight?: number;
          comments_weight?: number;
          watch_completion_weight?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      feed_audit: {
        Row: {
          id: string;
          user_id: string | null;
          post_id: string | null;
          rank_reason: string | null;
          score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          post_id?: string | null;
          rank_reason?: string | null;
          score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          post_id?: string | null;
          rank_reason?: string | null;
          score?: number | null;
          created_at?: string;
        };
      };
      governance_feedback: {
        Row: {
          id: string;
          user_id: string;
          fairness_score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fairness_score: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fairness_score?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      algorithm_changelog: {
        Row: {
          id: string;
          version: string;
          description: string;
          changes: any;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          version: string;
          description: string;
          changes?: any;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          version?: string;
          description?: string;
          changes?: any;
          created_at?: string;
          created_by?: string | null;
        };
      };
      payout_history: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          week_end: string;
          total_impressions: number;
          total_earnings: number;
          posts_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          week_end: string;
          total_impressions?: number;
          total_earnings?: number;
          posts_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          week_end?: string;
          total_impressions?: number;
          total_earnings?: number;
          posts_count?: number;
          created_at?: string;
        };
      };
      mall_products: {
        Row: {
          id: string;
          post_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          price: number;
          product_url: string | null;
          image_url: string | null;
          clicks: number;
          sales: number;
          views: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          price: number;
          product_url?: string | null;
          image_url?: string | null;
          clicks?: number;
          sales?: number;
          views?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          product_url?: string | null;
          image_url?: string | null;
          clicks?: number;
          sales?: number;
          views?: number;
          created_at?: string;
        };
      };
      mall_affiliates: {
        Row: {
          id: string;
          product_id: string;
          network: string;
          tracking_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          network: string;
          tracking_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          network?: string;
          tracking_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mall_clicks: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          ref: string | null;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          ref?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string | null;
          ref?: string | null;
          clicked_at?: string;
        };
      };
    };
    Views: {
      post_metrics: {
        Row: {
          id: string;
          user_id: string;
          caption: string | null;
          video_url: string | null;
          image_url: string | null;
          created_at: string;
          likes: number;
          comments: number;
          impressions: number;
          avg_watch_ms: number;
          watch_completion: number;
          fair_score: number;
        };
      };
    };
  };
};
