# Live Streaming Feature - Testing Guide

## 🎯 What Was Built

### 1. **Home Page - Live Now Panel** (`app/page.tsx`)
- Displays live sessions where `is_live = true`
- Shows session title, started time (relative), and viewer count
- Real-time updates via Supabase Postgres subscriptions
- Links to individual live viewer pages

### 2. **Live Viewer Page** (`app/live/[id]/page.tsx`)
- Dynamic route for viewing individual live sessions
- Placeholder video area (ready for stream integration)
- Auto-increments viewer count on mount
- Auto-decrements viewer count on unmount
- Real-time updates for session status changes
- Shows "Stream Ended" when `is_live = false`

### 3. **Time Utilities** (`lib/time-utils.ts`)
- `formatRelativeTime()` - Converts timestamps to human-readable format
- Examples: "just now", "5m ago", "2h ago", "3d ago"

### 4. **Database Functions** (`supabase-viewer-functions.sql`)
- `increment_viewer(session_id)` - Safely increments viewer count
- `decrement_viewer(session_id)` - Safely decrements (never below 0)

---

## 🧪 How to Test

### **Step 1: Set Up Database Functions**
Run this SQL in your Supabase SQL Editor:

```sql
-- Create increment function
CREATE OR REPLACE FUNCTION increment_viewer(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET viewers = viewers + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Create decrement function
CREATE OR REPLACE FUNCTION decrement_viewer(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET viewers = GREATEST(viewers - 1, 0)
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_viewer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_viewer(UUID) TO authenticated;
```

### **Step 2: Sign In**
1. Go to `/login`
2. Enter your email
3. Check inbox and click magic link
4. You'll be redirected to `/test-supabase`

### **Step 3: Create and Go Live**
1. On `/test-supabase`, click **"➕ Create New Session"**
2. Click **"🔴 Go Live"** 
3. Session is now live with `is_live = true`

### **Step 4: View on Home Page**
1. Navigate to `/` (home page)
2. You'll see a **"Live Now"** panel at the top
3. The panel shows:
   - 🔴 Red pulsing dot
   - Session title: "Live Test"
   - Started time (e.g., "2m ago")
   - Viewer count: "0 viewers"
   - **"View →"** button

### **Step 5: Watch the Live Stream**
1. Click **"View →"** on the home page
2. You're taken to `/live/{session-id}`
3. You'll see:
   - Video placeholder area with 🎥 icon
   - "LIVE" indicator (top-left, red badge)
   - Viewer count (top-right) - should increment to 1
   - Session title and info

### **Step 6: Test Viewer Counting**
1. Open `/live/{id}` in **multiple browser tabs/windows**
2. Watch viewer count increment with each new tab
3. Close a tab → viewer count decrements
4. Count never goes below 0

### **Step 7: End Live Stream**
1. Go back to `/test-supabase`
2. Click **"⏹️ End Live"**
3. Session updates to `is_live = false`

### **Step 8: Verify Real-Time Updates**
1. Keep `/live/{id}` page open while ending stream
2. Page should update immediately to show "Stream Ended"
3. Go to home page `/` - Live Now panel should disappear
4. All updates happen without page refresh

---

## 🔄 Real-Time Features

### **Home Page Real-Time:**
- Subscribes to `live_sessions` table changes
- Re-fetches live sessions when ANY row changes
- Automatically shows/hides Live Now panel
- Updates viewer counts in real-time

### **Live Viewer Page Real-Time:**
- Subscribes to specific session by ID
- Detects when `is_live` flips to `false`
- Immediately shows "Stream Ended" message
- Updates viewer count from other users

---

## 📊 Database Schema

Your `live_sessions` table should have:

```sql
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  is_live BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  viewers INTEGER DEFAULT 0
);
```

---

## 🎨 UI Features

### **Live Now Panel:**
- 🔴 Pulsing red dot animation
- Transparent glass-morphism card design
- Relative time stamps
- Viewer count display
- Only shows when sessions exist

### **Live Viewer Page:**
- 16:9 video aspect ratio placeholder
- "LIVE" badge with pulsing animation
- Viewer count badge (top-right)
- Gradient title matching ROLE OUT branding
- Stream ended state with duration

---

## 🐛 Troubleshooting

### **Issue: Live Now panel doesn't appear**
- Check console for errors
- Verify session has `is_live = true`
- Ensure Supabase RLS policies allow SELECT

### **Issue: Viewer count doesn't increment**
- Verify SQL functions were created in Supabase
- Check console for RPC errors
- Ensure authenticated user has EXECUTE permission

### **Issue: Real-time updates not working**
- Check Supabase Realtime is enabled for `live_sessions` table
- Verify subscription in browser console
- Check network tab for WebSocket connection

### **Issue: "Stream Ended" not showing**
- Verify session was updated with `is_live = false`
- Check real-time subscription logs
- Refresh page to force re-fetch

---

## 🚀 Next Steps

1. **Video Integration:**
   - Replace placeholder with actual video player
   - Integrate WebRTC or HLS streaming
   - Add playback controls

2. **Enhanced Features:**
   - Chat/comments during live stream
   - Reactions and emojis
   - Screen sharing
   - Recording capabilities

3. **Analytics:**
   - Track peak viewer count
   - Session duration analytics
   - Engagement metrics

---

## ✅ Testing Checklist

- [ ] Database functions created
- [ ] Sign in at `/login`
- [ ] Create session at `/test-supabase`
- [ ] Go live
- [ ] See session on home page `/`
- [ ] Click into `/live/{id}`
- [ ] Viewer count increments
- [ ] Open multiple tabs to test counting
- [ ] End live stream
- [ ] Verify "Stream Ended" appears
- [ ] Verify Live Now panel disappears
- [ ] Close tab and verify viewer decrements

---

## 📝 File Summary

**New Files:**
- `lib/time-utils.ts` - Relative time formatting
- `app/live/[id]/page.tsx` - Live viewer page
- `supabase-viewer-functions.sql` - Database functions

**Modified Files:**
- `app/page.tsx` - Added Live Now panel with realtime

**No Global CSS Changes** - All styles are inline or in `<style jsx global>`

---

**Your live streaming feature is ready! 🎉**
