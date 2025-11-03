import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface WebRTCViewerOptions {
  sessionId: string;
  isLive: boolean;
  onError?: (error: string) => void;
}

export function useWebRTCViewer({ sessionId, isLive, onError }: WebRTCViewerOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const viewerIdRef = useRef<string>(`viewer-${Date.now()}-${Math.random()}`);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const setupConnection = async () => {
    if (!isLive) return;

    try {
      console.log('Setting up viewer connection');

      // Create peer connection
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const stream = event.streams[0];
        setRemoteStream(stream);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        
        setIsConnected(true);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'candidate',
              candidate: event.candidate,
              viewerId: viewerIdRef.current,
            },
          });
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setIsConnected(false);
        }
      };

      // Join signaling channel
      const channel = supabase.channel(`webrtc:session:${sessionId}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
          console.log('Viewer received signal:', payload);

          if (payload.type === 'offer' && payload.viewerId === viewerIdRef.current) {
            // Handle offer from broadcaster
            if (pc && payload.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'answer',
                  sdp: answer,
                  viewerId: viewerIdRef.current,
                },
              });
            }
          } else if (payload.type === 'candidate' && payload.broadcasterId && payload.candidate) {
            // Handle ICE candidate from broadcaster - FIXED: Only process if meant for this viewer
            if (pc && payload.viewerId === viewerIdRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          } else if (payload.type === 'end') {
            // Stream ended
            console.log('Broadcaster ended stream');
            cleanup();
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Request offer from broadcaster
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'request-offer',
                viewerId: viewerIdRef.current,
              },
            });
          }
        });

      console.log('Viewer setup complete');
    } catch (err: any) {
      console.error('Error setting up viewer:', err);
      onError?.(`Connection error: ${err.message}`);
      cleanup();
    }
  };

  const cleanup = () => {
    console.log('Cleaning up viewer connection');

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
  };

  useEffect(() => {
    if (isLive) {
      setupConnection();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [sessionId, isLive]);

  return {
    isConnected,
    remoteStream,
    remoteVideoRef,
  };
}
