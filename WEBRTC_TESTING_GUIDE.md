# WebRTC Live Streaming - Complete Testing Guide

## 🎯 What Was Built

### **Core Features**
1. **WebRTC Broadcasting** - Peer-to-peer video/audio streaming from broadcaster to viewers
2. **Supabase Realtime Signaling** - WebRTC offer/answer/ICE candidate exchange via Supabase channels
3. **Camera Preview** - Live preview for broadcaster on /test-supabase
4. **Live Viewer Page** - Auto-connecting video player on /live/[id]
5. **Real-time Updates** - Stream status updates propagate instantly via Postgres subscriptions

### **Files Created/Modified**

**New Files:**
- `lib/hooks/useWebRTCBroadcaster.ts` - Hook for starting/managing webcam broadcast
- `lib/hooks/useWebRTCViewer.ts` - Hook for receiving/playing remote streams
- `WEBRTC_TESTING_GUIDE.md` - This file

**Modified Files:**
- `app/test-supabase/page.tsx` - Added camera preview and WebRTC controls
- `app/live/[id]/page.tsx` - Added WebRTC stream playback

---

## 🔧 Technical Implementation

### **WebRTC Flow**

```
BROADCASTER (test-supabase)          SIGNALING (Supabase)          VIEWER (live/[id])
─────────────────────────────        ─────────────────────         ──────────────────
1. getUserMedia() → camera                                         1. Join channel
2. Create RTCPeerConnection                                        2. Send request-offer
3. Add tracks to peer                                              
                                     ← request-offer ─────────
4. Create offer                                                    
5. setLocalDescription                                             
                                     ─── offer ───────────────→
                                                                   3. Receive offer
                                                                   4. setRemoteDescription
                                                                   5. Create answer
                                                                   6. setLocalDescription
                                     ← answer ────────────────
7. Receive answer                                                  
8. setRemoteDescription                                            
                                     ↔ ICE candidates ↔
9. Media flows via WebRTC (peer-to-peer)                          7. Receive tracks
                                                                   8. Play video
```

### **Signaling Messages**

```typescript
// Viewer → Broadcaster
{type: 'request-offer', viewerId: 'viewer-123'}

// Broadcaster → Viewer
{type: 'offer', sdp: {...}, viewerId: 'viewer-123'}

// Viewer → Broadcaster
{type: 'answer', sdp: {...}, viewerId: 'viewer-123'}

// Both directions
{type: 'candidate', candidate: {...}, viewerId/broadcasterId: '...'}

// Broadcaster → All
{type: 'end'}
```

---

## 🧪 Complete Testing Workflow

### **Prerequisites**
1. Supabase project set up with `live_sessions` table
2. RLS policies configured (see previous guides)
3. Database functions created (`increment_viewer`, `decrement_viewer`)
4. Two browser windows/tabs (or different devices)

### **Step 1: Sign In**
1. Open browser window A
2. Navigate to `/login`
3. Enter email address
4. Check inbox, click magic link
5. You're redirected to `/test-supabase`

### **Step 2: Create Session**
1. On `/test-supabase`, click **"➕ Create New Session"**
2. See success message with session ID
3. Note the session ID (e.g., `abc-123-def-456`)

### **Step 3: Start Broadcasting**
1. Click **"🔴 Go Live (Start Camera)"**
2. Browser prompts for camera/mic permissions
3. Click **"Allow"**
4. Camera preview appears on page showing your video
5. Status shows "✅ Session {id} is now LIVE with camera! 🔴"

### **Step 4: Open Viewer**
1. Open browser window B (or new device)
2. Navigate to `/` (home page)
3. See **"Live Now"** panel with your live session
4. Session shows: "Live Test • Started Xm ago • 1 viewer" (broadcaster counts as 1)
5. Click **"View →"** button

### **Step 5: Watch Stream**
1. Page shows "Connecting to stream..." briefly
2. Within 2-5 seconds, your camera feed appears
3. See "✓ Connected" badge (top-right)
4. See "LIVE" badge with pulsing red dot (top-left)
5. Viewer count increments to 2

### **Step 6: Test Multi-Viewer**
1. Open a third tab/window to `/live/{session-id}`
2. Viewer count increments to 3
3. All viewers see the same stream
4. Close one viewer tab → count decrements to 2

### **Step 7: End Stream**
1. Return to broadcaster window (window A at /test-supabase)
2. Click **"⏹️ End Live (Stop Camera)"**
3. Camera preview disappears
4. All viewer windows immediately show "Stream Ended"
5. Home page Live Now panel disappears

---

## 🎨 Visual Indicators

### **Broadcaster Page (/test-supabase)**
- **Before Go Live:** No video preview
- **While Live:** 
  - Red pulsing dot next to "Camera Preview (Broadcasting)"
  - Video preview showing your camera
  - Text: "Your camera feed is being broadcast..."

### **Viewer Page (/live/[id])**
- **Connecting:** 🔄 icon + "Connecting to stream..."
- **Connected:** 
  - Live video playing
  - "LIVE" badge (red, pulsing)
  - "✓ Connected" badge (green)
  - Viewer count badge
- **Stream Ended:** ⏹️ icon + "Stream Ended"

### **Home Page (/)**
- **No Live Sessions:** Clean home page
- **With Live Sessions:** 
  - "Live Now" panel with red pulsing dot
  - Session cards with title, time, viewer count

---

## 🔍 Troubleshooting

### **Camera Won't Start**

**Symptoms:**
- Error message: "Camera/mic error: Permission denied"
- No video preview appears

**Solutions:**
1. Check browser permissions (camera/mic must be allowed)
2. Try a different browser (Chrome/Edge recommended)
3. Check if another app is using the camera
4. Reload page and try again

### **Viewer Can't Connect**

**Symptoms:**
- Stuck on "Connecting to stream..."
- Never shows video

**Solutions:**
1. Check browser console for errors
2. Verify broadcaster is actually live (check database `is_live = true`)
3. Try refreshing the viewer page
4. Check network/firewall (WebRTC needs UDP)
5. Verify Supabase Realtime is enabled

**Console Commands to Debug:**
```javascript
// In viewer page console
console.log('Session ID:', sessionId);
console.log('Is Live:', session?.is_live);
console.log('Is Connected:', isConnected);
```

### **No Video/Audio**

**Symptoms:**
- Connection shows "✓ Connected" but no video

**Solutions:**
1. Check if broadcaster has video/audio tracks
2. Verify `getUserMedia` succeeded
3. Check video element's `srcObject` is set
4. Try `autoPlay` and `playsInline` attributes

### **Stream Lags or Freezes**

**Symptoms:**
- Video stutters
- Audio cuts out

**Solutions:**
1. Check network speed (both broadcaster and viewer)
2. Close other tabs/apps using bandwidth
3. Try lower resolution (modify `getUserMedia` constraints)
4. Consider using a TURN server for relaying (not peer-to-peer)

### **Viewer Count Wrong**

**Symptoms:**
- Count doesn't increment/decrement correctly

**Solutions:**
1. Verify database functions exist
2. Check RLS policies allow UPDATE on `live_sessions`
3. Look for console errors during increment/decrement
4. Manually check database: `SELECT viewers FROM live_sessions WHERE id = '...'`

---

## 🚀 Advanced Testing Scenarios

### **Test 1: Network Disconnection**
1. Start broadcast
2. Open viewer
3. Disconnect viewer's internet briefly
4. Reconnect
5. **Expected:** Video resumes or shows "Stream Ended"

### **Test 2: Browser Refresh**
1. Start broadcast
2. Open viewer
3. Refresh viewer page
4. **Expected:** Video reconnects within 5 seconds

### **Test 3: Multiple Simultaneous Broadcasts**
1. User A creates and goes live
2. User B creates and goes live
3. Open home page
4. **Expected:** Both sessions appear in Live Now panel

### **Test 4: End Live During Viewing**
1. Start broadcast with 3 viewers
2. Click End Live
3. **Expected:** All viewers see "Stream Ended" within 1 second

---

## 📊 Performance Metrics

### **Connection Time**
- **Target:** < 3 seconds from clicking "View" to playing video
- **Factors:** Network speed, STUN server response, ICE gathering

### **Latency**
- **Expected:** 0.5-2 seconds (WebRTC peer-to-peer)
- **Note:** Much lower than traditional streaming (HLS ~10-30s)

### **Scalability**
- **Current:** 1-to-many using multiple peer connections
- **Limitation:** Broadcaster's upload bandwidth
- **Recommendation:** Max 5-10 viewers per broadcast without TURN/SFU

---

## 🔐 Security Considerations

### **Camera/Mic Permissions**
- ✅ Browser prompts user for permission
- ✅ Permissions stored per-origin
- ✅ User can revoke at any time

### **WebRTC Security**
- ✅ All streams encrypted (DTLS-SRTP)
- ✅ ICE prevents unauthorized connections
- ✅ Signaling via authenticated Supabase channel

### **Privacy**
- ⚠️ Streams are NOT recorded (ephemeral)
- ⚠️ Anyone with session link can view (implement auth checks)
- ⚠️ No protection against screen recording

---

## 📝 Testing Checklist

- [ ] Sign in successfully
- [ ] Create new session
- [ ] Camera permissions granted
- [ ] Camera preview appears
- [ ] Session appears in Live Now panel
- [ ] Viewer can connect and see video
- [ ] Viewer count increments correctly
- [ ] Multiple viewers can watch simultaneously
- [ ] Closing viewer tab decrements count
- [ ] Ending live stops all viewers
- [ ] Stream ended message appears
- [ ] Live Now panel disappears when stream ends
- [ ] Sign out stops broadcast

---

## 🐛 Known Limitations

1. **No Recording** - Streams are live-only (add MediaRecorder API for recording)
2. **No Chat** - Consider adding realtime chat via Supabase
3. **No Screen Sharing** - Use `getDisplayMedia()` to add screen share
4. **No Bitrate Control** - WebRTC auto-adjusts, but manual control possible
5. **Limited Scalability** - Use SFU (Selective Forwarding Unit) for 10+ viewers
6. **STUN Only** - May fail behind strict firewalls (add TURN server)

---

## 🎓 Next Steps

1. **Add Recording** - Use MediaRecorder to save streams
2. **Add Chat** - Real-time messaging via Supabase
3. **Screen Sharing** - Switch between camera and screen
4. **Quality Settings** - Let broadcaster choose resolution
5. **Viewer Authentication** - Restrict who can view
6. **Analytics** - Track watch time, peak viewers
7. **TURN Server** - For better connectivity behind firewalls

---

## 💡 Tips for Best Results

1. **Use Chrome/Edge** - Best WebRTC support
2. **Good Lighting** - Improves camera quality
3. **Stable Network** - WiFi or wired connection
4. **Close Other Apps** - Free up bandwidth
5. **Test First** - Try a private stream before going public

---

**WebRTC live streaming is ready! 🎉**

Start by following the testing workflow above. For issues, check the troubleshooting section.
