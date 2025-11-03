# Live Chat Testing Guide

## Overview
Live chat has been integrated into the RollCall live streaming feature, enabling real-time messaging during live sessions using Supabase Realtime.

## Database Setup

The following tables and functions have been created in your development database:

### Tables:
1. **`live_sessions`** - Stores live streaming sessions
2. **`live_chat`** - Stores chat messages for each session

### Functions:
1. **`increment_viewer(session_id)`** - Atomically increments viewer count
2. **`decrement_viewer(session_id)`** - Atomically decrements viewer count
3. **`get_message_count(session_id)`** - Returns total message count for a session

### SQL Files:
- `supabase-chat-schema.sql` - Complete schema with RLS policies (for production Supabase)
- Development database has been set up without RLS for local testing

---

## Features Implemented

### 1. **Real-time Chat UI**
- ✅ Chat panel on right side (desktop) or bottom (mobile)
- ✅ Message history with avatar initials, timestamps, and message text
- ✅ Auto-scroll to newest messages
- ✅ Input box at bottom with "Send" button
- ✅ Disabled state when not signed in with link to `/login`

### 2. **Real-time Updates**
- ✅ Supabase Realtime subscription to `live_chat` table
- ✅ New messages appear instantly in all viewer tabs
- ✅ No full refetch needed - messages append live
- ✅ Initial fetch of last 100 messages on mount

### 3. **Message Sending**
- ✅ Insert message with `session_id`, `user_id`, and `message`
- ✅ Input validation (trim whitespace, prevent empty messages)
- ✅ Rate limiting: 300ms lockout between sends
- ✅ Clear input on success, keep focus
- ✅ Inline error toast for failures

### 4. **Stats Display**
- ✅ "n viewers • m messages" in chat header
- ✅ Viewer count updates in real-time
- ✅ Message count increments with each new message

### 5. **Stream End Handling**
- ✅ Chat remains visible when stream ends
- ✅ "Stream Ended" message shown in video area
- ✅ Users can still read messages after stream ends

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

### **Step 3: Open Viewer in Second Tab**
1. Copy the URL: `/live/{session-id}` (shown in browser or click "View" from home)
2. Open a **new browser tab** (or incognito window)
3. Navigate to the copied `/live/{session-id}` URL
4. Video should connect within 2-5 seconds
5. **Chat panel should appear on the right side**

### **Step 4: Test Chat**
#### Tab 1 (Broadcaster):
1. Navigate to `/live/{session-id}` in the broadcaster tab
2. Type a message: "Hello from broadcaster!"
3. Press Enter or click "Send"
4. Message should appear in chat panel

#### Tab 2 (Viewer):
1. **Message should appear instantly** in Tab 2
2. Type a reply: "Hello from viewer!"
3. Press Enter or click "Send"
4. Message should appear in both tabs

### **Step 5: Test Multi-Tab Chat**
1. Open a **third browser tab** to `/live/{session-id}`
2. Viewer count should show **3 viewers**
3. Send a message from Tab 3
4. **All three tabs should see the message instantly**
5. Close Tab 3
6. Viewer count should decrement to **2 viewers**

### **Step 6: Test Unauthenticated State**
1. Open `/live/{session-id}` in an **incognito window** (signed out)
2. Chat panel should show: "Sign in to join the chat"
3. Click "Sign In →" link
4. Should redirect to `/login`

### **Step 7: Test Stream End**
1. Return to broadcaster tab (Tab 1)
2. Click **"End Live (Stop Camera)"**
3. All viewer tabs should show "Stream Ended"
4. **Chat should remain visible**
5. Previous messages should still be readable
6. Input should still be enabled (users can continue chatting)

### **Step 8: Verify Database**
Run this SQL query in your database to verify messages were saved:

```sql
SELECT 
  lc.id, 
  lc.session_id, 
  lc.user_id, 
  lc.message, 
  lc.created_at,
  ls.title
FROM live_chat lc
JOIN live_sessions ls ON lc.session_id = ls.id
ORDER BY lc.created_at DESC
LIMIT 20;
```

You should see all messages sent during testing.

---

## Technical Details

### **Realtime Subscription**
- **Channel**: `live_chat:{sessionId}`
- **Event**: `postgres_changes` on `INSERT` to `live_chat` table
- **Filter**: `session_id=eq.{sessionId}`
- **Transport**: Supabase Realtime WebSocket

### **Message Flow**
```
User types message → sendMessage() → Supabase INSERT
                                    ↓
                              Database INSERT
                                    ↓
                         Supabase Realtime broadcast
                                    ↓
                         All subscribed clients receive
                                    ↓
                         Message appended to local state
                                    ↓
                         UI auto-scrolls to bottom
```

### **Rate Limiting**
- **Type**: Client-side lockout
- **Duration**: 300ms between sends
- **Implementation**: `lastSendTimeRef` tracks last send timestamp
- **User feedback**: Send button disabled during lockout

### **Performance**
- **Initial Load**: Fetches last 100 messages
- **Realtime Updates**: O(1) append, no refetch
- **Auto-scroll**: Smooth scroll to newest message
- **Memory**: Chat history capped at 100 messages (can be increased)

---

## Chat UI Details

### **Message Display**
- **Avatar**: Circular gradient background with user ID initials
- **Sender**: "You" for current user, initials for others
- **Timestamp**: Relative time (e.g., "2 minutes ago")
- **Message**: Word-wrapped text with proper styling
- **Highlight**: Current user's messages shown in gold color

### **Input Box**
- **Location**: Fixed at bottom of chat panel
- **Features**: 
  - Enter key to send
  - Auto-clear on success
  - Focus retained after send
  - Disabled when sending
  - Shows "..." when sending

### **Empty State**
- Message: "No messages yet. Start the conversation!"
- Centered in chat area

### **Signed Out State**
- Yellow info box
- Message: "Sign in to join the chat"
- "Sign In →" button links to `/login`

---

## Known Limitations

### **1. Message History**
- Only last 100 messages loaded on initial fetch
- Older messages require pagination (not implemented)
- Consider adding "Load More" for longer sessions

### **2. User Display Names**
- Currently shows user ID initials only
- Future: Fetch and display actual usernames from `profiles` table

### **3. Message Editing/Deletion**
- Not implemented yet
- RLS policies prepared for future implementation

### **4. Typing Indicators**
- Not implemented
- Can be added via Supabase Realtime presence

### **5. File/Image Sharing**
- Not supported
- Text-only messages

### **6. Moderation**
- No profanity filter or spam detection
- Admin moderation tools not implemented

---

## Troubleshooting

### **Messages Not Appearing**
1. Check browser console for errors
2. Verify Supabase Realtime is enabled for `live_chat` table:
   - Go to Supabase Dashboard → Database → Replication
   - Enable replication for `live_chat` table
3. Check network tab for WebSocket connection
4. Verify user is signed in (`user.id` should exist)

### **"Failed to send message" Error**
1. Check user is authenticated
2. Verify `live_chat` table exists in database
3. Check RLS policies (if enabled in production)
4. Inspect browser console for detailed error

### **Chat Panel Not Visible**
1. Ensure `/live/[id]/page.tsx` has been updated
2. Check for TypeScript/compilation errors
3. Verify `useLiveChat` hook is imported correctly
4. Clear browser cache and hard reload

### **Auto-scroll Not Working**
1. Check `chatEndRef` is attached to the bottom div
2. Verify `useEffect` dependency on `[messages]`
3. Try manual scroll in browser DevTools

---

## Production Deployment Notes

### **Supabase Realtime Setup**
Before deploying to production:

1. **Enable Realtime for `live_chat`**:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat;
   ```

2. **Run RLS policies** from `supabase-chat-schema.sql`:
   - Users can only insert their own messages
   - Anyone can view messages (read-only)
   - Users can update/delete their own messages

3. **Set up indexes** (already in schema):
   ```sql
   CREATE INDEX idx_live_chat_session_time 
   ON public.live_chat(session_id, created_at DESC);
   ```

### **Environment Variables**
No additional env vars needed - uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## File Changes

### **New Files**
- `lib/hooks/useLiveChat.ts` - Chat hook with realtime subscriptions
- `supabase-chat-schema.sql` - Database schema with RLS policies
- `LIVE_CHAT_TESTING_GUIDE.md` - This guide

### **Modified Files**
- `app/live/[id]/page.tsx` - Added chat panel UI and integration

---

## Next Steps (Optional Enhancements)

1. **User Profiles** - Show real names instead of initials
2. **Message Reactions** - Add emoji reactions to messages
3. **Typing Indicators** - Show "User is typing..." via Supabase Presence
4. **Message Pagination** - Load more messages on scroll up
5. **Rich Text** - Support markdown, links, mentions
6. **Moderation** - Admin tools, profanity filter, ban/timeout
7. **Chat Replay** - Save and replay chat for VODs
8. **Chat Notifications** - Desktop/push notifications for @mentions
9. **Emojis** - Emoji picker integration
10. **Message Search** - Search through chat history

---

## Success Criteria

✅ **You should be able to:**
1. Sign in and create a live session
2. Open live stream in two separate browser tabs
3. Send messages from Tab 1 → appear instantly in Tab 2
4. Send messages from Tab 2 → appear instantly in Tab 1
5. See viewer count and message count update in real-time
6. Verify all messages saved in `live_chat` table
7. Chat remains visible after stream ends

**If all criteria pass, live chat is working correctly!** 🎉
