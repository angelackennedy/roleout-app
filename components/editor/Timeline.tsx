'use client';

import { useRef, useEffect } from 'react';
import { EditorProject, Clip } from './types';

interface TimelineProps {
  project: EditorProject;
  currentTime: number;
  isPlaying: boolean;
  selectedClip: Clip | null;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onSelectClip: (clip: Clip | null) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onDeleteClip: (clipId: string) => void;
}

export function Timeline({
  project,
  currentTime,
  isPlaying,
  selectedClip,
  onTimeChange,
  onPlayPause,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      let time = currentTime;
      playbackIntervalRef.current = setInterval(() => {
        time += 0.033; // ~30fps
        if (time >= project.duration) {
          time = 0;
        }
        onTimeChange(time);
      }, 33);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, currentTime, project.duration, onTimeChange]);

  const PIXELS_PER_SECOND = 50;
  const timelineWidth = Math.max(project.duration * PIXELS_PER_SECOND, 1000);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / PIXELS_PER_SECOND;
    onTimeChange(Math.max(0, Math.min(time, project.duration)));
  };

  const handleClipDrag = (clipId: string, newStartTime: number) => {
    onUpdateClip(clipId, { startTime: Math.max(0, newStartTime) });
  };

  return (
    <div style={{
      height: 300,
      borderTop: '1px solid #333',
      background: '#0f0f0f',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Controls */}
      <div style={{
        height: 60,
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 20,
      }}>
        <button
          onClick={onPlayPause}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(212,175,55,0.2)',
            border: '1px solid rgba(212,175,55,0.4)',
            color: '#d4af37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div style={{
          fontSize: 13,
          fontFamily: 'monospace',
          color: '#aaa',
        }}>
          {formatTime(currentTime)} / {formatTime(project.duration)}
        </div>
      </div>

      {/* Timeline Tracks */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: timelineWidth,
            height: '100%',
            position: 'relative',
          }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 20,
            borderBottom: '1px solid #333',
            background: '#111',
          }}>
            {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: i * PIXELS_PER_SECOND,
                  top: 0,
                  height: '100%',
                  borderLeft: '1px solid #444',
                  paddingLeft: 4,
                  fontSize: 10,
                  color: '#666',
                }}
              >
                {i}s
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div style={{ paddingTop: 20 }}>
            {project.tracks.map((track, trackIndex) => (
              <div
                key={track.id}
                style={{
                  height: 60,
                  borderBottom: '1px solid #222',
                  position: 'relative',
                }}
              >
                {/* Track label */}
                <div style={{
                  position: 'sticky',
                  left: 0,
                  width: 80,
                  height: '100%',
                  background: '#111',
                  borderRight: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: '#888',
                  textTransform: 'capitalize',
                  zIndex: 1,
                }}>
                  {track.type}
                </div>

                {/* Clips */}
                {track.clips.map(clip => {
                  const left = clip.startTime * PIXELS_PER_SECOND + 80;
                  const width = clip.duration * PIXELS_PER_SECOND;
                  const isSelected = selectedClip?.id === clip.id;

                  return (
                    <div
                      key={clip.id}
                      draggable
                      onDragEnd={(e) => {
                        const rect = timelineRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const x = e.clientX - rect.left - 80;
                        handleClipDrag(clip.id, x / PIXELS_PER_SECOND);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip);
                      }}
                      style={{
                        position: 'absolute',
                        left,
                        top: 5,
                        width,
                        height: 50,
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.2) 100%)'
                          : 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                        border: isSelected ? '2px solid #d4af37' : '1px solid #444',
                        borderRadius: 4,
                        cursor: 'grab',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        fontSize: 11,
                        color: '#fff',
                      }}
                    >
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {clip.type === 'text' ? (clip.text || 'Text') : `Clip ${clip.id.slice(-4)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            style={{
              position: 'absolute',
              left: currentTime * PIXELS_PER_SECOND + 80,
              top: 0,
              bottom: 0,
              width: 2,
              background: '#d4af37',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{
              width: 10,
              height: 10,
              background: '#d4af37',
              borderRadius: '50%',
              position: 'absolute',
              top: 5,
              left: -4,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
