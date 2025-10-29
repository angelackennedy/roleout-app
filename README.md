# RollCall MVP

A video-based social platform with transparent moderation, built with Next.js, TypeScript, and Supabase.

## Features (FA³–FA⁵)

### Core Features
- **Feed**: Browse vertical videos with infinite scroll
- **Upload**: Record or upload videos (≤60 seconds) with client-side trimming
- **Post Page**: View videos, like, comment, and flag content
- **Profile**: User profiles with posted videos
- **Authentication**: Sign up and login with Supabase Auth

### FA³ - Moderation & Transparency
- **Transparency Panel**: Public moderation log
- **Community Flags**: Users can flag inappropriate content
- **Moderation Queue**: Review and action flagged content

### FA⁴ - Wallet (Placeholder)
- UI shell for future cryptocurrency integration
- Planned: tipping, donations, and creator revenue

### FA⁵ - Metrics (Placeholder)
- Dashboard shell for analytics
- Planned: engagement metrics, A/B testing, audience insights

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a Supabase project at https://supabase.com
   - Run the SQL schema in `supabase-schema.sql` in your Supabase SQL Editor
   - Create a storage bucket named `videos` and make it public

3. **Configure environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
app/
├── auth/          # Authentication pages (login, signup)
├── feed/          # Video feed
├── upload/        # Video upload with trimming
├── post/[id]/     # Individual post page
├── profile/[id]/  # User profile pages
├── moderation/    # Moderation & transparency panel (FA³)
├── wallet/        # Wallet placeholder (FA⁴)
├── metrics/       # Analytics placeholder (FA⁵)
└── layout.tsx     # Root layout with auth provider

components/
└── Header.tsx     # Navigation header

lib/
├── supabase.ts    # Supabase client configuration
└── auth-context.tsx # Authentication context provider
```

## Database Schema

Run `supabase-schema.sql` to create:
- `profiles` - User profiles
- `posts` - Video posts
- `likes` - Post likes
- `comments` - Post comments
- `moderation_actions` - Moderation log (FA³)
- `flags` - Content reports

## Deployment

This project is configured for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (Supabase credentials)
4. Deploy

## License

MIT
