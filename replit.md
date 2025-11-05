# RollCall MVP

## Overview
RollCall is a video-based social platform focused on authenticity and transparent moderation. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Recent Changes
- **2025-11-05**: ROLL OUT Mall (E-commerce Integration)
  - Created mall_products table with product info and engagement metrics
  - Built /mall page with product grid ordered by clicks, sales, views
  - Created /mall/manage page for creator product management with stats
  - Added Mall Performance card to Creator Dashboard showing revenue, clicks, sales
  - API routes: /api/mall/products, /api/mall/my-products, /api/mall/add-product, /api/mall/track-click
  - **Note**: After creating new tables, run `NOTIFY pgrst, 'reload schema';` to refresh Supabase PostgREST cache
  - Products include title, description, price, product_url, image_url
  - Engagement tracking: clicks, sales, views for analytics
  - Security: All mall APIs require authentication and scope to creator_id

- **2025-11-03**: Reporting & Personal Hide
  - Added hidden_posts table for personal content filtering
  - Post menu now includes "Hide this post" and "Report" buttons
  - Hidden posts excluded from For You and Following feeds
  - Report dialog with textarea for user-provided reason
  - Unique constraint prevents duplicate reports/hides
  - RLS policies: users can only hide/report for themselves
  - Admin-only access to reports table (via JWT role claim)
  - Updated get_ranked_feed RPC to exclude hidden posts

- **2025-11-03**: Notifications System
  - Automatic notifications for likes, comments, and follows
  - Created notifications table with RLS policies and composite indexes
  - Database triggers auto-create notifications when users interact
  - Realtime notification feed at /notifications with unread badge
  - Unread count badge in header (bell icon with red counter)
  - Mark as read on click, "Mark all as read" button
  - Clickable notifications link to post pages or user profiles
  - Self-notification prevention (don't notify for own actions)
  - Live updates via Supabase realtime subscriptions

- **2025-11-03**: Direct Messaging System
  - Built 1-on-1 DM system with realtime chat
  - Created conversations, conversation_members, and messages tables
  - Inbox page showing conversation list with last messages
  - DM thread pages with realtime message subscriptions
  - Message button on profile pages with create-on-demand conversations
  - Optimistic UI updates for instant message feedback
  - Secure RLS policies (users can only add themselves to conversations)
  - Idempotent conversation creation via `get_or_create_conversation` RPC

- **2025-11-03**: Live Session Chat
  - Updated live_chat schema with profiles foreign key reference
  - Realtime chat on /live/[id] with 300ms rate limiting
  - Fetches last 100 messages on mount
  - Chat input disabled for unauthenticated users
  - Auto-scroll to newest messages
  - RLS policies: SELECT for all, INSERT only for authenticated users

- **2025-11-03**: Client-Side Video Processing
  - Integrated ffmpeg.wasm for automatic video processing
  - Thumbnail extraction from first keyframe
  - Video transcoding to H.264/baseline for compatibility
  - Progress UI with "Processing..." and "Uploading..." indicators
  - Skip processing button if taking too long (< 50% progress)
  - Standardized file naming: `{userId}/{postId}.mp4` and `.jpg`
  - Fallback to original video if processing fails

- **2025-11-03**: Drafts System with Autosave
  - Implemented 2-tab upload UI (New/Drafts) with visual draft grid
  - Added autosave with 2-second debounce and "Saved" indicator
  - Hashtag extraction from caption with trending tags suggestions (top 10)
  - Video cover frame picker with timeline scrubbing
  - Draft-to-post publishing flow with automatic draft cleanup
  - Created `post_drafts` table with RLS policies and updated_at trigger
  - Built reusable hooks: `use-drafts` and `use-trending-hashtags`

- **2025-11-03**: Algorithmic For You Feed
  - Implemented personalized ranking with multi-factor scoring
  - Tracks engagement: watch time, likes, comments, follows
  - Recency decay, overexposure penalty, creator diversity
  - Cold start boost for new posts, view count tracking
  - Real-time analytics with post_impressions table
  - RPC function `get_ranked_feed` with SECURITY DEFINER

- **2025-10-29**: Initial MVP implementation
  - Set up Next.js 14 with App Router, TypeScript, and Tailwind CSS
  - Integrated Supabase for auth, database, and storage
  - Implemented core modules: Feed, Upload, Post, Profile, Moderation (FA³), Wallet (FA⁴), Metrics (FA⁵)
  - Created database schema with tables for users, posts, likes, comments, moderation actions, and flags
  - Added client-side video trimming with 60-second limit
  - Built moderation transparency panel with public mod log

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

### Key Features
1. **Authentication** - Supabase Auth with email/password
2. **Algorithmic Feed** - Personalized For You feed with engagement-based ranking
3. **Drafts System** - 2-tab upload with autosave, hashtag helpers, cover picker
4. **Video Upload** - Client-side trimming (≤60s), Supabase Storage
5. **Post Page** - Video playback, likes, comments, flagging
6. **User Profiles** - User info and posted videos
7. **Notifications** - Realtime notifications for likes, comments, follows with unread badge
8. **Direct Messaging** - 1-on-1 DMs with realtime chat and message history
9. **Live Streaming** - WebRTC sessions with live chat and emoji reactions
10. **Analytics** - Real-time view tracking, engagement metrics
11. **Moderation Panel (FA³)** - Public transparency log, community flags
12. **Wallet Placeholder (FA⁴)** - UI shell for crypto integration
13. **Metrics Placeholder (FA⁵)** - Analytics dashboard shell

### Database Schema
- `profiles` - User profiles (extends auth.users)
- `posts` - Video posts with engagement counts
- `post_drafts` - Draft posts with autosave
- `post_impressions` - Analytics tracking for algorithmic feed
- `notifications` - User notifications for likes, comments, follows
- `reports` - User-submitted content reports (admin-only view)
- `hidden_posts` - Personal content filtering per user
- `conversations` - DM conversations metadata
- `conversation_members` - DM conversation participants
- `messages` - Direct messages with realtime chat
- `live_chat` - Live session chat messages
- `live_reactions` - Live emoji reactions with realtime sync
- `likes` - Post likes (with triggers for count updates)
- `comments` - Post comments (with triggers for count updates)
- `moderation_actions` - Public moderation log
- `flags` - User-submitted content reports
- `mall_products` - E-commerce products attached to posts with engagement tracking
- `payout_history` - Creator earnings history with weekly aggregation
- `fairness_votes` - Community voting on algorithm fairness

### File Structure
```
app/
├── auth/login, signup - Authentication pages
├── feed/ - Video feed with infinite scroll
├── upload/ - Video upload with client-side trimming
├── post/[id]/ - Individual post with likes/comments
├── profile/[id]/ - User profile pages
├── moderation/ - Transparency panel (FA³)
├── wallet/ - Crypto wallet placeholder (FA⁴)
└── metrics/ - Analytics placeholder (FA⁵)

lib/
├── supabase.ts - Supabase client
└── auth-context.tsx - Auth provider

components/
└── Header.tsx - Navigation
```

## User Preferences
- Development server runs on port 5000
- Supabase credentials stored in Replit Secrets
- Database schema provided in `supabase-schema.sql`

## Next Steps (Future Enhancements)
- Implement magic link authentication
- Add feed ranking algorithm (recency × engagement)
- Enable autoplay in feed
- Add infinite scroll pagination
- Implement 80-character caption limit
- Complete FA⁴ wallet integration (crypto payments, tipping)
- Complete FA⁵ metrics (analytics, A/B testing)
- Add i18n support (EN/ES)
