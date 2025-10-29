# RollCall MVP

## Overview
RollCall is a video-based social platform focused on authenticity and transparent moderation. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Recent Changes
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
2. **Video Feed** - Browse posts with engagement metrics
3. **Video Upload** - Client-side trimming (≤60s), Supabase Storage
4. **Post Page** - Video playback, likes, comments, flagging
5. **User Profiles** - User info and posted videos
6. **Moderation Panel (FA³)** - Public transparency log, community flags
7. **Wallet Placeholder (FA⁴)** - UI shell for crypto integration
8. **Metrics Placeholder (FA⁵)** - Analytics dashboard shell

### Database Schema
- `profiles` - User profiles (extends auth.users)
- `posts` - Video posts with engagement counts
- `likes` - Post likes (with triggers for count updates)
- `comments` - Post comments (with triggers for count updates)
- `moderation_actions` - Public moderation log
- `flags` - User-submitted content reports

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
