import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupportedMimeType } from '@/lib/utils/mediaRecorder';

interface WebRTCBroadcasterOptions {
  sessionId: string;
  userId: string | null;
  onError?: (error: string) => void;
  onRecordingComplete?: (publicUrl: string) => void;
}

export function useWebRTCBroadcaster({ sessionId, userId, onError, onRecordingComplete }: WebRTCBroadcasterOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingMimeTypeRef = useRef<string>('');

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const startRecording = (stream: MediaStream) => {
    try {
      const { mimeType } = getSupportedMimeType();
      recordingMimeTypeRef.current = mimeType;
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { 
        mimeType: mimeType || undefined 
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // Collect data every 1 second
      recordingStartTimeRef.current = performance.now();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log('Recording started with mimeType:', mimeType);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      onError?.(`Recording error: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !userId) {
      return;
    }

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        console.log('Recording stopped, processing...');
        setIsRecording(false);

        // Calculate duration
        const recordingEndTime = performance.now();
        const durationMs = recordingEndTime - recordingStartTimeRef.current;
        const durationSeconds = Math.floor(durationMs / 1000);

        // Create blob from chunks
        const blob = new Blob(recordedChunksRef.current, {
          type: recordingMimeTypeRef.current || 'video/webm',
        });

        console.log('Recording blob created:', {
          size: blob.size,
          type: blob.type,
          duration: durationSeconds,
        });

        // Upload to Supabase Storage
        try {
          await uploadRecording(blob, durationSeconds);
        } catch (err: any) {
          console.error('Upload error:', err);
          onError?.(`Upload failed: ${err.message}`);
        }

        resolve();
      };

      recorder.stop();
      mediaRecorderRef.current = null;
    });
  };

  const uploadRecording = async (blob: Blob, durationSeconds: number) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setUploadProgress(0);

    // Generate file path
    const timestamp = Date.now();
    const filePath = `recordings/${sessionId}/${sessionId}-${timestamp}.webm`;

    console.log('Uploading to:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    setUploadProgress(100);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    console.log('Upload successful, public URL:', publicUrl);

    // Save to database
    const { error: dbError } = await supabase
      .from('live_recordings')
      .insert({
        session_id: sessionId,
        user_id: userId,
        storage_path: filePath,
        public_url: publicUrl,
        duration_seconds: durationSeconds,
        size_bytes: blob.size,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw new Error(`Failed to save recording metadata: ${dbError.message}`);
    }

    console.log('Recording metadata saved to database');
    onRecordingComplete?.(publicUrl);
  };

  const startBroadcast = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setLocalStream(stream);

      // Set local video preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Start recording
      startRecording(stream);

      // Create signaling channel
      const channel = supabase.channel(`webrtc:session:${sessionId}`);
      channelRef.current = channel;

      // Listen for viewer requests
      channel
        .on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
          console.log('Broadcaster received signal:', payload);

          if (payload.type === 'request-offer') {
            // Create a new peer connection for this viewer
            const viewerId = payload.viewerId;
            await createPeerConnectionForViewer(viewerId, stream);
          } else if (payload.type === 'answer' && payload.viewerId) {
            // Handle answer from viewer
            const pc = peerConnectionsRef.current.get(payload.viewerId);
            if (pc && payload.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            }
          } else if (payload.type === 'candidate' && payload.viewerId && payload.candidate) {
            // Handle ICE candidate from viewer
            const pc = peerConnectionsRef.current.get(payload.viewerId);
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          }
        })
        .subscribe();

      setIsStreaming(true);
      console.log('Broadcast started');
    } catch (err: any) {
      console.error('Error starting broadcast:', err);
      onError?.(`Camera/mic error: ${err.message}`);
      stopBroadcast();
    }
  };

  const createPeerConnectionForViewer = async (viewerId: string, stream: MediaStream) => {
    try {
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionsRef.current.set(viewerId, pc);

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'candidate',
              candidate: event.candidate,
              broadcasterId: 'broadcaster',
              viewerId: viewerId, // FIXED: Include viewer ID for proper scoping
            },
          });
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'offer',
            sdp: offer,
            viewerId: viewerId,
          },
        });
      }

      console.log('Created peer connection for viewer:', viewerId);
    } catch (err) {
      console.error('Error creating peer connection:', err);
    }
  };

  const stopBroadcast = async () => {
    console.log('Stopping broadcast');

    // Stop recording first
    if (isRecording && mediaRecorderRef.current) {
      await stopRecording();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Leave channel and broadcast end signal
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'end' },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setLocalStream(null);
    setIsStreaming(false);
    streamRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBroadcast();
    };
  }, []);

  return {
    isStreaming,
    isRecording,
    uploadProgress,
    localStream,
    localVideoRef,
    startBroadcast,
    stopBroadcast,
  };
}
