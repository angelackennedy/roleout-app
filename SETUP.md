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

## Storage Buckets Summary

After running all SQL files, you should have these buckets:

| Bucket Name | Public | Usage |
|------------|--------|-------|
| `avatars` | Yes (read) | User profile pictures |
| `posts` | Yes (read) | Video posts and cover images |
| `{userId}` | Private | Live stream recordings (auto-created per user) |

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
5. **Like posts** - Click heart button (optimistic UI, instant feedback)
6. **Comment on posts** - Click comment button to open drawer, add comments with realtime updates
7. **Follow users** - Visit `/u/[username]` and click Follow/Unfollow button
8. **View profiles** - See follower/following counts, bio, and join date
9. **Live streaming** - Join sessions at `/live/[sessionId]` with WebRTC

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
