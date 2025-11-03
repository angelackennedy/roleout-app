# Live Stream Recording & Replay Guide

## Overview

RollCall automatically records all live streams and makes them available for replay after the stream ends. This guide explains how the recording system works and how to test it.

## Features

- **Automatic Recording**: Every live stream is automatically recorded from start to finish
- **Browser-Based**: Uses MediaRecorder API - no server-side processing needed
- **WebM Format**: Recordings are saved in WebM format with browser-optimized codecs
- **Automatic Upload**: Recordings are uploaded to Supabase Storage when the stream ends
- **Instant Replay**: Viewers can watch replays immediately after upload completes
- **Recording Indicator**: Shows "Recording..." badge while streaming
- **Upload Progress**: Displays upload progress bar during processing

## How It Works

### 1. Recording Process

When a broadcaster starts their stream:
1. WebRTC captures the camera/mic stream
2. MediaRecorder starts recording simultaneously
3. Video chunks are collected in memory during the stream
4. Recording indicator appears in the broadcaster UI

### 2. Upload Process

When the broadcaster ends their stream:
1. MediaRecorder stops and finalizes the recording
2. Recording is packaged as a WebM blob
3. File is uploaded to Supabase Storage: `{userId}/{sessionId}/{sessionId}-{timestamp}.webm`
4. Upload progress is shown to broadcaster
5. Recording metadata is saved to `live_recordings` table

### 3. Replay Process

When a viewer visits an ended stream:
1. App checks `live_recordings` table for saved recording
2. If recording exists, displays video player with controls
3. Shows "REPLAY" badge instead of "LIVE" badge
4. Viewers can play, pause, seek, and control volume

## Database Schema

### live_recordings Table

```sql
CREATE TABLE live_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Structure

```
recordings/
  └── {userId}/
      └── {sessionId}/
          └── {sessionId}-{timestamp}.webm
```

## Testing the Recording Feature

### Step 1: Start a Live Stream

1. Go to `/test-supabase`
2. Click "Create Session" to create a live session
3. Click "Go Live" to start streaming
4. You should see:
   - Camera preview with your webcam feed
   - "Recording..." badge in top right
   - Red pulsing "LIVE" indicator

### Step 2: Verify Recording is Active

Check the console logs:
```
Recording started with mimeType: video/webm;codecs=vp8,opus
```

### Step 3: End the Stream

1. Click "End Live Session"
2. Watch for upload process:
   - Progress bar appears showing "Uploading... X%"
   - Console shows: "Recording stopped, processing..."
   - Console shows: "Upload successful, public URL: ..."

### Step 4: Watch the Replay

1. Open the viewer URL in a new tab: `/live/{sessionId}`
2. You should see:
   - Video player with controls
   - "REPLAY" badge instead of "LIVE"
   - Your recorded stream playing back

## Browser Compatibility

### Supported Formats (Priority Order)

1. **video/webm;codecs=vp8,opus** (Chrome, Edge, Firefox)
2. **video/webm;codecs=h264,opus** (Some Chrome versions)
3. **video/webm** (Fallback for older browsers)

The system automatically detects the best supported format for your browser.

### Tested Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14.1+ (limited WebM support)

## Storage & RLS Policies

### Storage Bucket: `recordings`

```sql
-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload their recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ((bucket_id = 'recordings') AND ((storage.foldername(name))[1] = auth.uid()::text));

-- Allow anyone to view recordings
CREATE POLICY "Anyone can view recordings"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'recordings');
```

### Database RLS Policies

```sql
-- Allow authenticated users to insert their own recordings
CREATE POLICY "Users can insert their recordings"
  ON live_recordings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow anyone to view recordings
CREATE POLICY "Anyone can view recordings"
  ON live_recordings FOR SELECT
  TO public
  USING (true);
```

## Troubleshooting

### Recording Not Starting

**Symptoms**: No "Recording..." badge appears when going live

**Solutions**:
1. Check browser console for MediaRecorder errors
2. Verify browser supports MediaRecorder API
3. Check camera/mic permissions are granted

### Upload Fails with 403 Error

**Symptoms**: Console shows "Upload failed: 403"

**Solutions**:
1. Verify user is authenticated (`userId` is not null)
2. Check Supabase Storage RLS policies are created
3. Ensure storage bucket `recordings` exists
4. Verify file path starts with `userId`

### Replay Not Showing

**Symptoms**: "Processing replay..." message persists

**Solutions**:
1. Check `live_recordings` table for entry matching `session_id`
2. Verify `public_url` is accessible (try opening in new tab)
3. Check browser console for video playback errors
4. Ensure session has `is_live = false` and `ended_at` timestamp

### Video Won't Play

**Symptoms**: Replay loads but won't play

**Solutions**:
1. Check browser supports WebM format
2. Verify video file uploaded completely (check `size_bytes`)
3. Try different browser (Chrome recommended)
4. Check browser console for codec errors

## Performance Considerations

### Memory Usage

- Recordings are kept in browser memory during streaming
- A 10-minute stream at 720p typically uses ~100-200 MB RAM
- Memory is released after upload completes

### Upload Time

- Upload time depends on recording size and network speed
- Typical upload speeds:
  - 1-minute stream: ~10-30 seconds
  - 5-minute stream: ~1-2 minutes
  - 10-minute stream: ~2-4 minutes

### Storage Costs

Supabase Storage pricing:
- 1 GB free tier
- $0.021/GB/month for additional storage
- Typical recordings: ~10 MB per minute of video

## API Reference

### MediaRecorder Utility

```typescript
import { getSupportedMimeType } from '@/lib/utils/mediaRecorder';

const { mimeType, extension } = getSupportedMimeType();
// Returns best supported format for current browser
```

### useWebRTCBroadcaster Hook

```typescript
const {
  isRecording,        // true while recording
  uploadProgress,     // 0-100 during upload
  startBroadcast,     // Starts stream + recording
  stopBroadcast,      // Stops stream + uploads recording
} = useWebRTCBroadcaster({
  sessionId: 'session-uuid',
  userId: 'user-uuid',
  onRecordingComplete: (publicUrl) => {
    console.log('Recording available at:', publicUrl);
  },
});
```

## Future Enhancements

Potential improvements:
- [ ] Real-time upload progress (chunked uploads)
- [ ] Recording quality settings (resolution, bitrate)
- [ ] Thumbnail generation from first frame
- [ ] Recording duration limits
- [ ] Automatic cleanup of old recordings
- [ ] Download recording button
- [ ] Share recording link

## Security Notes

1. **Authentication Required**: Only authenticated users can upload recordings
2. **User Isolation**: Users can only upload to their own folder (`userId`)
3. **Public Playback**: Recordings are publicly viewable by anyone with the URL
4. **No Encryption**: Recordings are stored unencrypted in Supabase Storage

For private recordings, you would need to:
- Update RLS policies to restrict SELECT access
- Implement signed URLs for temporary access
- Add user permissions to `live_recordings` table
