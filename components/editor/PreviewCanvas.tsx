'use client';

import { useRef, useEffect } from 'react';
import { EditorProject, Asset } from './types';

interface PreviewCanvasProps {
  project: EditorProject;
  currentTime: number;
  isPlaying: boolean;
  assets: Asset[];
}

export function PreviewCanvas({ project, currentTime, isPlaying, assets }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    renderFrame();
  }, [currentTime, project]);

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all visible clips
    project.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const isVisible = currentTime >= clip.startTime && 
                         currentTime < clip.startTime + clip.duration;
        
        if (!isVisible) return;

        const asset = assets.find(a => a.id === clip.assetId);
        
        if (clip.type === 'video' && asset) {
          renderVideoClip(ctx, clip, asset, currentTime - clip.startTime);
        } else if (clip.type === 'text') {
          renderTextClip(ctx, clip, canvas.width, canvas.height);
        }
      });
    });
  };

  const renderVideoClip = (
    ctx: CanvasRenderingContext2D,
    clip: any,
    asset: Asset,
    relativeTime: number
  ) => {
    let videoElement = videoElementsRef.current.get(clip.id);
    
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.src = asset.url;
      videoElement.crossOrigin = 'anonymous';
      videoElementsRef.current.set(clip.id, videoElement);
    }

    // Set video time
    videoElement.currentTime = clip.trimStart + relativeTime;

    // Draw video frame
    try {
      ctx.drawImage(videoElement, 0, 0, ctx.canvas.width, ctx.canvas.height);
    } catch (e) {
      // Video not ready yet
    }
  };

  const renderTextClip = (
    ctx: CanvasRenderingContext2D,
    clip: any,
    width: number,
    height: number
  ) => {
    const text = clip.text || 'Text';
    const fontSize = clip.fontSize || 48;
    const fontFamily = clip.fontFamily || 'Arial';
    const color = clip.color || '#ffffff';

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = clip.position?.x || width / 2;
    const y = clip.position?.y || height / 2;

    // Draw text shadow if specified
    if (clip.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Draw text stroke if specified
    if (clip.stroke) {
      ctx.strokeStyle = clip.stroke;
      ctx.lineWidth = 3;
      ctx.strokeText(text, x, y);
    }

    ctx.fillText(text, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      padding: 20,
    }}>
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          border: '1px solid #333',
          borderRadius: 4,
        }}
      />
    </div>
  );
}
