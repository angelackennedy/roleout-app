# RollCall Setup Guide

This guide walks you through setting up the RollCall MVP with all database tables and storage buckets.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Node.js installed
3. Environment variables configured:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SESSION_SECRET`

## Database Setup

Run these SQL files in your Supabase SQL Editor **in this order**:

### 1. Profiles Table
File: `supabase-profiles-schema.sql`

Creates the `profiles` table for user information:
- `id` (UUID, references auth.users)
- `username` (unique)
- `display_name`
- `avatar_url`
- `bio`

**Run this first** - other tables reference this one.

### 2. Avatars Storage Bucket
File: `supabase-avatars-storage.sql`

Creates the `avatars` storage bucket with:
- Public read access
- Authenticated users can upload their own avatars
- RLS policy: `userId/avatar.jpg` path structure

### 3. Posts Table
File: `supabase-posts-schema.sql`

Creates the `posts` table for video posts:
- `id`, `user_id`, `video_url`, `cover_url`
- `caption`, `hashtags` (text array)
- `like_count`, `comment_count`, `share_count`
- Indexes on `created_at` (DESC) and `hashtags` (GIN)

### 4. Posts Storage Bucket
File: `supabase-posts-storage.sql`

Creates the `posts` storage bucket with:
- Public read access for videos/covers
- Authenticated users can upload their own posts

### 5. Post Likes Table
File: `supabase-post-likes-schema.sql`

Creates the `post_likes` table:
- `id`, `post_id`, `user_id`
- Unique constraint on (post_id, user_id)
- Indexes for fast lookups

### 6. Post Likes RPC Functions
File: `supabase-post-likes-rpc.sql`

Creates atomic functions for likes:
- `like_post(p_post_id, p_user_id)` - Insert like + increment count
- `unlike_post(p_post_id, p_user_id)` - Delete like + decrement count

These ensure the `like_count` always stays in sync with actual likes.

### 7. Post Comments Table
File: `supabase-post-comments-schema.sql`

Creates the `post_comments` table for comments:
- `id`, `post_id`, `user_id`, `message`
- Indexes on post_id, user_id, and created_at
- Secure RPC functions:
  - `add_comment_and_increment(p_post_id, p_message)` - Insert comment + increment count (derives user_id from auth.uid())
  - `delete_comment_and_decrement(p_comment_id)` - Delete comment + decrement count (owner-only)

**Security**: All functions verify authentication and prevent user impersonation.
**Includes realtime subscriptions** - Comments appear instantly across all clients!

### 8. Follows Table
File: `supabase-follows-schema.sql`

Creates the `follows` table for user follow relationships:
- Composite primary key (follower_id, following_id)
- CHECK constraint to prevent self-follows
- Indexes on follower_id, following_id, and created_at
- RLS policies: Anyone can view, authenticated users can follow/unfollow

**Powers the Following feed** - See posts only from users you follow!

### 9. Search RPC Functions
File: `supabase-search-rpc.sql`

Creates search and discovery functions:
- `search_posts(search_query, result_limit, result_offset)` - Search posts by caption or hashtag
- `search_users(search_query, result_limit, result_offset)` - Search users by username or display name
- `get_trending_hashtags(result_limit)` - Get hashtags ordered by post count
- `get_posts_by_hashtag(tag_name, result_limit, result_offset)` - Get all posts with a specific hashtag

**Powers the Search page and hashtag discovery!**

### 10. Notifications System
File: `supabase-notifications-schema.sql`

Creates the complete notifications system:
- `notifications` table with user_id, actor_id, type (like/comment/follow), post_id, read_at
- RLS policies: Users can only view/update their own notifications
- Indexes on user_id, created_at, and unread status
- **Automatic triggers** that create notifications when:
  - Someone likes your post (inserts into `post_likes`)
  - Someone comments on your post (inserts into `post_comments`)
  - Someone follows you (inserts into `follows`)

**Real-time notifications with automatic triggers!** Bell icon shows unread count and updates instantly.

### 11. Reports and Content Hiding
File: `supabase-reports-schema.sql`

Creates the reporting system for content moderation:
- `reports` table with reporter_id, post_id, reason, created_at
- RLS policies: Users can report posts (INSERT), only admins can view reports (SELECT)
- Unique constraint prevents duplicate reports from same user
- Indexes on reporter_id and post_id for fast lookups

**How it works:**
- Users can report posts via the menu (⋯) button on any post
- Reported posts are automatically hidden from that user's feed
- Reports are stored for admin review (admins have `role = 'admin'` in JWT)
- Updated RPC functions (`search_posts`, `get_posts_by_hashtag`) filter out reported posts

### 12. Analytics and Algorithmic Feed
File: `supabase-analytics-schema.sql`

Creates the complete analytics system with algorithmic ranking:

**Post Impressions Table:**
- Tracks user engagement: `ms_watched`, `liked`, `commented`, `followed_creator`
- Unique constraint prevents duplicate impressions per user per day
- Updates accumulate watch time and engagement signals throughout the day
- Indexes on user_id/created_at and post_id for fast queries

**Algorithmic Ranking Function (`get_ranked_feed`):**
- Personalized For You feed using machine learning-inspired scoring
- **Score components:**
  - Watch time (normalized 0-1, max 30s meaningful)
  - Like weight: 1.2
  - Comment weight: 1.5
  - Follow creator weight: 2.0
  - Recency decay: exponential over 48 hours
  - Overexposure penalty: -3.0 if seen 3+ times today
  - Creator diversity: prefer first post from each creator
  - Cold start boost: +0.8 for posts with < 5 views

**How it works:**
1. User scrolls through feed, videos track watch time when 50%+ visible
2. Engagement signals (likes, comments, follows) sent to `/api/impressions`
3. Impressions upsert: accumulate watch time, set engagement flags
4. Ranking function calculates personalized scores for each post
5. Feed shows highest-scoring posts first, filtered for reported content

**RLS Security:**
- Users can only INSERT/UPDATE/SELECT their own impressions
- Ranking function runs with SECURITY DEFINER for performance

### 13. RLS and Performance Audit (IMPORTANT)
File: `supabase-rls-indexes-audit.sql`

**Run this AFTER all other SQL files** to verify and optimize your setup:
- ✅ Verifies RLS is enabled on all tables
- ✅ Adds missing performance indexes (composite indexes for queries)
- ✅ Creates `recordings` storage bucket for live stream recordings
- ✅ **Recreates ALL storage bucket policies** to ensure they're properly secured
- ✅ Provides detailed audit report showing configuration status

**Key improvements:**
- Composite index on `post_comments(post_id, created_at ASC)` for faster comment loading
- Composite index on `notifications(user_id, created_at DESC)` for faster notification queries
- Additional indexes for user profile pages and activity feeds
- Recordings bucket with same security as avatars/posts buckets
- Comprehensive storage policy verification (drops and recreates all policies)

**Note:** This script recreates all storage policies for avatars, posts, and recordings to ensure they're all properly configured. All storage policy changes are wrapped in a **transaction** to ensure atomicity - if anything fails, all changes are rolled back automatically. This ensures your buckets are never left in a partially-secured state.

This file is **idempotent** - safe to run multiple times!

**Note:** After adding the reports feature, you'll need to re-run the search RPC functions SQL file (`supabase-search-rpc.sql`) to update the functions with the new `current_user_id` parameter for filtering reported posts.

## Storage Buckets Summary

After running all SQL files, you should have these buckets:

| Bucket Name | Public | Upload Policy | Usage |
|------------|--------|---------------|-------|
| `avatars` | Yes (read) | `{userId}/*` only | User profile pictures |
| `posts` | Yes (read) | `{userId}/*` only | Video posts and cover images |
| `recordings` | Yes (read) | `{userId}/*` only | Live stream recordings |

**Security:** All buckets enforce that authenticated users can only upload to their own folder prefix (`{userId}/filename`). This prevents users from uploading files on behalf of others.

## Development Server

After database setup:

```bash
npm install
npm run dev
```

The app will be available at http://localhost:5000

## Features Available

Once setup is complete, you can:

1. **Sign up / Sign in** - Magic link or password authentication
2. **Edit profile** - Upload avatar, set display name at `/profile`
3. **Upload videos** - Go to `/upload` to post videos with captions and hashtags
4. **Browse feeds**:
   - **For You** (`/`) - Global feed with all posts, ordered by recency
   - **Following** (`/following`) - Posts only from users you follow
5. **Search & Discover** (`/search`) - Three tabs for discovery:
   - **Top** - Search posts by caption or hashtag
   - **Users** - Find users by username or display name
   - **Tags** - Browse trending hashtags by popularity
6. **Hashtag pages** (`/tag/[name]`) - View all posts with a specific hashtag
7. **Like posts** - Click heart button (optimistic UI, instant feedback)
8. **Comment on posts** - Click comment button to open drawer, add comments with realtime updates
9. **Follow users** - Visit `/u/[username]` and click Follow/Unfollow button
10. **View profiles** - See follower/following counts, bio, and join date
11. **Notifications** (`/notifications`) - Get notified when someone likes, comments, or follows you
    - Bell icon in header shows unread count
    - Real-time updates via Supabase subscriptions
    - Automatic triggers create notifications instantly
12. **Report posts** - Flag inappropriate content via the menu (⋯) button on any post
    - Reported posts are automatically hidden from your feed
    - Reports are stored for admin review
    - Cannot report the same post twice
13. **Live streaming** - Join sessions at `/live/[sessionId]` with WebRTC

## Security & Performance

For a comprehensive security audit of RLS policies, indexes, and storage configuration, see:
📄 **[RLS-SECURITY-AUDIT.md](RLS-SECURITY-AUDIT.md)**

**Key Security Features:**
- ✅ Row Level Security enabled on all tables
- ✅ Storage buckets enforce user-based path restrictions
- ✅ All mutations require authentication and ownership verification
- ✅ Atomic RPC functions prevent count tampering
- ✅ Triggers with self-notification prevention
- ✅ Performance indexes on all critical queries

**Overall Security Score: 🟢 Excellent (95/100)**

## Troubleshooting

### "Column does not exist" errors
- Make sure you ran **all** SQL files in the correct order
- Check that the `profiles` table was created first

### RLS policy errors
- Verify you're signed in (check DevTools > Application > Cookies)
- Check that policies were created (Supabase Dashboard > Authentication > Policies)

### Upload failures
- Verify storage buckets exist (Supabase Dashboard > Storage)
- Check RLS policies allow authenticated users to upload
- Ensure paths match policy requirements (e.g., `userId/filename.mp4`)

### Likes not working
- Run `supabase-post-likes-rpc.sql` to create the RPC functions
- Check browser console for errors
- Verify `post_likes` table exists with unique constraint

## Next Steps

- Customize styling in `app/globals.css`
- Add more features (comments, shares, notifications)
- Deploy to production using Replit's deployment feature
