import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface WebRTCBroadcasterOptions {
  sessionId: string;
  onError?: (error: string) => void;
}

export function useWebRTCBroadcaster({ sessionId, onError }: WebRTCBroadcasterOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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

  const stopBroadcast = () => {
    console.log('Stopping broadcast');

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
    localStream,
    localVideoRef,
    startBroadcast,
    stopBroadcast,
  };
}
