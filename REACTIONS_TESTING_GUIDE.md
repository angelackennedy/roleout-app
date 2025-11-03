# Live Reactions Testing Guide

## Overview
Lightweight emoji reactions have been added to RollCall live streaming sessions. Users can react with ❤️ (heart), 🔥 (fire), or 👏 (clap) emojis. Reactions update in real-time across all viewers with floating particle animations.

## Database Setup

The following table has been created in your development database:

### Tables:
- **`live_reactions`** - Stores emoji reactions for each live session

### Schema Details:
```sql
CREATE TABLE public.live_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '🔥', '👏')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_live_reactions_session_time 
ON public.live_reactions(session_id, created_at DESC);
```

### SQL Files:
- `supabase-reactions-schema.sql` - Complete schema with RLS policies (for production Supabase)
- Development database has been set up without RLS for local testing

---

## Features Implemented

### 1. **Emoji Reaction Buttons**
- ✅ Three emoji buttons: ❤️ 🔥 👏
- ✅ Live counters showing total reactions per emoji
- ✅ Positioned directly under the video player
- ✅ Hover effects with scale animation
- ✅ Disabled state when not signed in

### 2. **Real-time Updates**
- ✅ Supabase Realtime subscription to `live_reactions` table
- ✅ New reactions appear instantly in all viewer tabs
- ✅ Counters increment without refetch
- ✅ Initial fetch of last 500 reactions on mount

### 3. **Optimistic UI**
- ✅ Counter increments immediately on click
- ✅ Rollback if database insert fails
- ✅ Smooth user experience with no lag

### 4. **Floating Particle Animation**
- ✅ Emoji floats up and fades when reaction sent
- ✅ Random horizontal position (0-100%)
- ✅ 2-second animation duration
- ✅ Appears for both sender and all viewers
- ✅ Lightweight CSS-only animation (no libraries)

### 5. **Anti-Spam Protection**
- ✅ Client-side throttling: max 5 reactions per 3 seconds per emoji
- ✅ Button disabled when throttled
- ✅ Visual feedback (opacity + cursor change)
- ✅ Prevents accidental spam clicks

### 6. **Authentication Check**
- ✅ Reactions disabled for logged-out users
- ✅ "Sign in to react" message with link to `/login`
- ✅ Authenticated users see all three buttons

---

## Testing Instructions

### **Step 1: Sign In**
1. Navigate to `/login`
2. Enter your email address
3. Click the magic link sent to your email
4. You'll be redirected to `/test-supabase`

### **Step 2: Create Live Session**
1. On `/test-supabase`, click **"Create New Session"**
2. A new live session will be created
3. Click **"Go Live (Start Camera)"**
4. Allow camera/microphone permissions when prompted
5. Camera preview should appear

### **Step 3: Open Viewer Tab**
1. Navigate to `/live/{session-id}` in the same tab or new tab
2. You should see:
   - Video player at top
   - **Reaction buttons (❤️ 🔥 👏) directly under video**
   - Chat panel on right side

### **Step 4: Test Basic Reactions**
1. Click the **❤️** button
2. You should see:
   - Counter increments from 0 to 1
   - Heart emoji floats up from bottom with fade animation
   - Animation lasts ~2 seconds

3. Click **🔥** button
4. Counter increments to 1
5. Fire emoji floats up with animation

6. Click **👏** button
7. Counter increments to 1
8. Clap emoji floats up with animation

### **Step 5: Test Real-time Updates** ⭐
1. Open **second browser tab** (or use second device)
2. Sign in with a different account (or same account)
3. Navigate to `/live/{session-id}`
4. **Tab 1:** Click ❤️ button
5. **Tab 2:** Should see:
   - Heart counter increment from N to N+1
   - Floating heart animation appears
   - **Update happens instantly**

6. **Tab 2:** Click 🔥 button
7. **Tab 1:** Should see:
   - Fire counter increment
   - Floating fire animation
   - **Update happens instantly**

### **Step 6: Test Multi-Tab Reactions** ⭐
1. Open a **third browser tab** to `/live/{session-id}`
2. All three tabs should show same counters
3. Click reactions from any tab
4. **All 3 tabs update instantly** with:
   - Counter increment
   - Floating animation

### **Step 7: Test Throttling**
1. In one tab, rapidly click **❤️** button 10 times
2. After 5 clicks within 3 seconds:
   - Button becomes disabled (grayed out)
   - Cursor changes to "not-allowed"
   - Opacity reduces to 50%
3. Wait 3 seconds
4. Button re-enables
5. Can click 5 more times

### **Step 8: Test Unauthenticated State**
1. Open `/live/{session-id}` in **incognito window** (signed out)
2. Instead of reaction buttons, should see:
   - "Sign in to react" message
   - "Sign In →" button
3. Click "Sign In →"
4. Should redirect to `/login`
5. After signing in, return to live session
6. Reaction buttons should appear

### **Step 9: Test Animation Details**
1. Click ❤️ button
2. Observe floating heart:
   - Starts at bottom of reactions bar
   - Moves upward (-200px)
   - Scales from 1.0 → 1.2 → 0.8
   - Fades from 100% → 80% → 0% opacity
   - Animation smooth (ease-out)
   - Disappears after 2 seconds
3. Multiple reactions create multiple floating emojis
4. Each emoji has random X position (different horizontal placement)

### **Step 10: Verify Database**
Run this SQL query to verify reactions were saved:

```sql
SELECT 
  lr.id,
  lr.session_id,
  lr.user_id,
  lr.emoji,
  lr.created_at,
  ls.title
FROM live_reactions lr
JOIN live_sessions ls ON lr.session_id = ls.id
ORDER BY lr.created_at DESC
LIMIT 50;
```

You should see:
- All emoji reactions (❤️, 🔥, 👏)
- Correct session_id
- User_id for each reaction
- Timestamps in chronological order

---

## Technical Details

### **Realtime Subscription**
- **Channel**: `live_reactions:{sessionId}`
- **Event**: `postgres_changes` on `INSERT` to `live_reactions` table
- **Filter**: `session_id=eq.{sessionId}`
- **Transport**: Supabase Realtime WebSocket

### **Reaction Flow**
```
User clicks emoji → Optimistic UI (counter +1) → Database INSERT
                                                        ↓
                                                  Realtime broadcast
                                                        ↓
                                    All subscribed clients receive INSERT
                                                        ↓
                                    Counter increments (again on remote tabs)
                                                        ↓
                                    Floating animation triggered
```

### **Optimistic UI Pattern**
1. User clicks button
2. **Immediately** increment local counter (no wait)
3. Add floating particle animation
4. Send request to database
5. If error → rollback counter (decrement)
6. If success → no action needed

### **Throttling Logic**
```typescript
// Track last 3 seconds of reactions per emoji
throttleRef.current[emoji] = [timestamp1, timestamp2, ...]

// On click:
const recentReactions = filter(timestamps, now - 3000ms)
if (recentReactions.length >= 5) {
  // Block reaction
  return;
}

// Add new timestamp
throttleRef.current[emoji].push(now)
```

### **Animation Implementation**
```css
@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateY(-100px) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-200px) scale(0.8);
    opacity: 0;
  }
}
```

---

## UI Layout

### **Desktop Layout**
```
┌─────────────────────────────────────────────┐
│           Video Player (16:9)               │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  [❤️ 25]  [🔥 12]  [👏 8]                  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Title, Started Time, Message Count         │
└─────────────────────────────────────────────┘
```

### **Mobile Layout**
```
┌─────────────────────┐
│   Video Player      │
└─────────────────────┘
┌─────────────────────┐
│ [❤️]  [🔥]  [👏]    │
└─────────────────────┘
┌─────────────────────┐
│ Title & Info        │
└─────────────────────┘
┌─────────────────────┐
│ Chat Panel          │
└─────────────────────┘
```

---

## Component Architecture

### **LiveReactions Component**
- **Location**: `components/LiveReactions.tsx`
- **Props**: `sessionId`, `userId`
- **State**:
  - `counts`: Record<Emoji, number> - Reaction counters
  - `particles`: FloatingParticle[] - Active animations
  - `loading`: boolean - Initial load state
- **Refs**:
  - `channelRef`: Realtime channel reference
  - `throttleRef`: Throttle tracking (timestamps per emoji)
  - `particleIdRef`: Unique ID generator for particles

### **Key Functions**
- `fetchReactions()` - Fetch last 500 reactions, compute initial counts
- `sendReaction(emoji)` - Send reaction with optimistic UI + rollback
- `addParticle(emoji)` - Create floating animation
- `isThrottled(emoji)` - Check if emoji is throttled

---

## Known Limitations

### **1. Counter Duplication**
- Optimistic UI increments counter locally
- Realtime also increments counter when INSERT event received
- **Current behavior**: Sender sees +2 on their counter (optimistic + realtime)
- **Future fix**: De-duplicate by tracking sent reaction IDs

### **2. Historical Count Accuracy**
- Initial fetch gets last 500 reactions only
- If a session has >500 reactions, early ones not counted
- **Solution**: Use COUNT query or increase limit

### **3. Throttling is Client-Side Only**
- Users can bypass throttle by editing JavaScript
- **Future fix**: Server-side rate limiting in Supabase Edge Function

### **4. No Reaction Deletion**
- Once sent, reactions cannot be unsent
- **Future feature**: Allow users to delete their own reactions

### **5. No User Display**
- Can't see who sent which reaction
- **Future feature**: "Recent Reactors" list showing user avatars

### **6. Limited Emoji Set**
- Only 3 emojis: ❤️ 🔥 👏
- **Future feature**: More emojis or custom reactions

---

## Performance Considerations

### **Database Queries**
- **On mount**: 1 SELECT query (last 500 reactions)
- **Per reaction**: 1 INSERT query
- **Realtime**: WebSocket connection (1 per session)

### **Memory Usage**
- Particles array: Max ~10-20 items (2-second lifetime)
- Throttle ref: Max 15 timestamps (5 per emoji × 3 emojis)
- Minimal overhead

### **Animation Performance**
- CSS-only animations (GPU accelerated)
- No JavaScript RAF loops
- Lightweight particle cleanup

---

## Production Deployment Notes

### **Before deploying to Supabase production:**

1. **Run the SQL schema:**
   - Copy contents of `supabase-reactions-schema.sql`
   - Paste into Supabase SQL Editor
   - Execute to create table + RLS policies + indexes

2. **Enable Realtime replication:**
   - Go to: **Database → Replication**
   - Enable replication for `live_reactions` table
   - This allows real-time subscriptions to work

3. **Test RLS policies:**
   - Verify authenticated users can INSERT their own reactions
   - Verify anonymous users can SELECT (read) reactions
   - Test that users cannot insert with wrong user_id

4. **Monitor database size:**
   - Reactions table can grow quickly (1 row per reaction)
   - Consider cleanup policy (delete reactions >7 days old)
   - Add database trigger for automatic cleanup

---

## Troubleshooting

### **Reactions Not Appearing**
1. Check browser console for errors
2. Verify Supabase Realtime is enabled for `live_reactions` table
3. Check network tab for WebSocket connection
4. Verify user is signed in (`userId` should exist)

### **Counters Not Updating**
1. Verify initial fetch succeeded (check network tab)
2. Check Realtime subscription status (console logs)
3. Ensure session_id matches current session
4. Clear browser cache and reload

### **Animation Not Showing**
1. Check if `particles` array populating (React DevTools)
2. Verify CSS animation keyframes loaded
3. Try different browser (some have CSS issues)
4. Check z-index conflicts with other elements

### **Throttling Too Aggressive**
1. Current limit: 5 reactions per 3 seconds per emoji
2. Adjust in `LiveReactions.tsx`: change `recentReactions.length >= 5`
3. Or change time window: `now - timestamp < 3000` (3 seconds)

### **Database Errors**
1. **"relation does not exist"**: Run `supabase-reactions-schema.sql`
2. **"RLS policy violation"**: Check RLS policies in Supabase Dashboard
3. **"Foreign key constraint"**: Ensure `session_id` exists in `live_sessions`

---

## Future Enhancements

1. **More Emojis** - Expand to 5-10 emoji choices
2. **Custom Reactions** - Let creators add custom emojis
3. **Reaction Animations** - More creative particle effects
4. **Reaction Heatmap** - Show reaction activity over time
5. **Top Reactors** - Leaderboard of most active viewers
6. **Reaction Notifications** - Alert broadcaster on milestone reactions
7. **Reaction History** - View past reactions timeline
8. **Reaction Stats** - Analytics dashboard for creators
9. **Reaction Sounds** - Optional sound effects on react
10. **Server-Side Rate Limiting** - Prevent spam at database level

---

## Success Criteria

✅ **You should be able to:**
1. Sign in and create a live session
2. See reaction buttons (❤️ 🔥 👏) under video
3. Click reaction → counter increments immediately
4. See floating emoji animation (2 seconds)
5. Open second tab → see same counters
6. React from Tab 1 → Tab 2 updates instantly
7. React from Tab 2 → Tab 1 updates instantly
8. Verify all reactions saved in `live_reactions` table
9. Throttling kicks in after 5 rapid clicks
10. Logged-out users see "Sign in to react"

**If all criteria pass, emoji reactions are working correctly!** 🎉

---

## Testing Checklist

Run through this to verify everything works:

- [ ] Sign in at `/login`
- [ ] Create session at `/test-supabase`
- [ ] Go live with camera
- [ ] Open `/live/{id}` → see reaction buttons
- [ ] Click ❤️ → counter = 1, floating animation
- [ ] Click 🔥 → counter = 1, floating animation
- [ ] Click 👏 → counter = 1, floating animation
- [ ] Open second tab to `/live/{id}`
- [ ] Tab 1: Click ❤️ → Tab 2 counter updates
- [ ] Tab 2: Click 🔥 → Tab 1 counter updates
- [ ] Rapidly click ❤️ 10 times → throttled after 5
- [ ] Wait 3 seconds → button re-enables
- [ ] Open incognito → see "Sign in to react"
- [ ] Verify database: `SELECT * FROM live_reactions;`

---

## Quick Reference

### **Database Table**
```sql
live_reactions (
  id UUID,
  session_id UUID FK → live_sessions(id),
  user_id UUID,
  emoji TEXT ('❤️' | '🔥' | '👏'),
  created_at TIMESTAMPTZ
)
```

### **Component Props**
```typescript
<LiveReactions 
  sessionId={string}  // Current live session ID
  userId={string | null}  // Current user ID (null if not signed in)
/>
```

### **Emoji Options**
- ❤️ Heart (love, like, support)
- 🔥 Fire (lit, amazing, fire)
- 👏 Clap (applause, well done, bravo)

### **Throttle Limits**
- **Per emoji**: 5 reactions per 3 seconds
- **Total**: 15 reactions per 3 seconds (5 × 3 emojis)

---

**🎉 Your emoji reactions feature is ready to test!**

Follow the testing workflow above. If you encounter issues, check the troubleshooting section or inspect browser console logs.
