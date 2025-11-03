'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { EditorProject, Asset, Clip } from './types';

interface PreviewCanvasProps {
  project: EditorProject;
  currentTime: number;
  isPlaying: boolean;
  assets: Asset[];
}

export function PreviewCanvas({ project, currentTime, isPlaying, assets }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const [videosLoaded, setVideosLoaded] = useState(false);

  // Preload all video/audio assets
  useEffect(() => {
    const loadAssets = async () => {
      const videoAssets = assets.filter(a => a.type === 'video');
      const audioAssets = assets.filter(a => a.type === 'audio');

      // Load videos
      for (const asset of videoAssets) {
        if (!videoElementsRef.current.has(asset.id)) {
          const video = document.createElement('video');
          video.src = asset.url;
          video.crossOrigin = 'anonymous';
          video.preload = 'metadata';
          
          await new Promise<void>((resolve) => {
            video.addEventListener('loadedmetadata', () => {
              videoElementsRef.current.set(asset.id, video);
              resolve();
            });
            video.addEventListener('error', () => resolve()); // Continue even if failed
          });
        }
      }

      // Load audio
      for (const asset of audioAssets) {
        if (!audioElementsRef.current.has(asset.id)) {
          const audio = document.createElement('audio');
          audio.src = asset.url;
          audio.crossOrigin = 'anonymous';
          audio.preload = 'metadata';
          
          await new Promise<void>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              audioElementsRef.current.set(asset.id, audio);
              resolve();
            });
            audio.addEventListener('error', () => resolve());
          });
        }
      }

      setVideosLoaded(true);
    };

    loadAssets();
  }, [assets]);

  // Render frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videosLoaded) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render tracks in order: video -> stickers -> text
    const sortedTracks = [...project.tracks].sort((a, b) => {
      const order = { video: 0, sticker: 1, text: 2, audio: 3 };
      return order[a.type] - order[b.type];
    });

    sortedTracks.forEach(track => {
      track.clips.forEach(clip => {
        const isVisible = currentTime >= clip.startTime && 
                         currentTime < clip.startTime + clip.duration;
        
        if (!isVisible) return;

        const relativeTime = currentTime - clip.startTime;
        const asset = assets.find(a => a.id === clip.assetId);

        try {
          if (clip.type === 'video' && asset) {
            renderVideoClip(ctx, clip, asset, relativeTime, canvas.width, canvas.height);
          } else if (clip.type === 'audio' && asset) {
            playAudioClip(clip, asset, relativeTime);
          } else if (clip.type === 'text') {
            renderTextClip(ctx, clip, canvas.width, canvas.height, relativeTime);
          }
        } catch (e) {
          console.warn('Error rendering clip:', e);
        }
      });
    });
  }, [currentTime, project, assets, videosLoaded]);

  // Continuous rendering
  useEffect(() => {
    const animate = () => {
      renderFrame();
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animate();
    } else {
      renderFrame(); // Render single frame when paused
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, renderFrame]);

  const renderVideoClip = (
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    asset: Asset,
    relativeTime: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const videoElement = videoElementsRef.current.get(asset.id);
    if (!videoElement || videoElement.readyState < 2) return;

    // Update video time
    const videoTime = clip.trimStart + (relativeTime * (clip.speed || 1));
    if (Math.abs(videoElement.currentTime - videoTime) > 0.1) {
      videoElement.currentTime = videoTime;
    }

    // Apply effects via CSS filters
    let filterString = '';
    if (clip.effects) {
      if (clip.effects.brightness) filterString += `brightness(${clip.effects.brightness}) `;
      if (clip.effects.contrast) filterString += `contrast(${clip.effects.contrast}) `;
      if (clip.effects.saturation) filterString += `saturate(${clip.effects.saturation}) `;
    }
    if (filterString) ctx.filter = filterString.trim();

    // Calculate dimensions
    let sx = 0, sy = 0, sWidth = videoElement.videoWidth, sHeight = videoElement.videoHeight;
    let dx = 0, dy = 0, dWidth = canvasWidth, dHeight = canvasHeight;

    // Apply crop if specified
    if (clip.crop) {
      sx = clip.crop.x;
      sy = clip.crop.y;
      sWidth = clip.crop.width;
      sHeight = clip.crop.height;
    }

    // Maintain aspect ratio
    const videoAspect = sWidth / sHeight;
    const canvasAspect = canvasWidth / canvasHeight;
    
    if (videoAspect > canvasAspect) {
      dHeight = canvasHeight;
      dWidth = canvasHeight * videoAspect;
      dx = (canvasWidth - dWidth) / 2;
    } else {
      dWidth = canvasWidth;
      dHeight = canvasWidth / videoAspect;
      dy = (canvasHeight - dHeight) / 2;
    }

    // Apply rotation if specified
    if (clip.rotation) {
      ctx.save();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((clip.rotation * Math.PI) / 180);
      ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    }

    // Draw video frame
    ctx.drawImage(videoElement, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    if (clip.rotation) {
      ctx.restore();
    }

    // Reset filter
    ctx.filter = 'none';
  };

  const playAudioClip = (clip: Clip, asset: Asset, relativeTime: number) => {
    const audioElement = audioElementsRef.current.get(asset.id);
    if (!audioElement) return;

    const audioTime = clip.trimStart + (relativeTime * (clip.speed || 1));
    
    if (isPlaying && !clip.muted) {
      if (Math.abs(audioElement.currentTime - audioTime) > 0.1) {
        audioElement.currentTime = audioTime;
      }
      audioElement.volume = clip.volume || 1;
      if (audioElement.paused) {
        audioElement.play().catch(() => {});
      }
    } else {
      audioElement.pause();
    }
  };

  const renderTextClip = (
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    width: number,
    height: number,
    relativeTime: number
  ) => {
    const text = clip.text || 'Text';
    const fontSize = clip.fontSize || 48;
    const fontFamily = clip.fontFamily || 'Arial, sans-serif';
    const color = clip.color || '#ffffff';

    // Calculate opacity based on motion
    let opacity = 1;
    const duration = clip.duration;
    
    if (clip.motion === 'fade') {
      const fadeTime = Math.min(duration * 0.2, 0.5);
      if (relativeTime < fadeTime) {
        opacity = relativeTime / fadeTime;
      } else if (relativeTime > duration - fadeTime) {
        opacity = (duration - relativeTime) / fadeTime;
      }
    }

    // Position based on motion
    let x = clip.position?.x || width / 2;
    let y = clip.position?.y || height / 2;

    if (clip.motion && clip.motion.startsWith('slide')) {
      const slideTime = Math.min(duration * 0.3, 1);
      const progress = Math.min(relativeTime / slideTime, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      switch (clip.motion) {
        case 'slide-left':
          x = width + (x - width) * eased;
          break;
        case 'slide-right':
          x = -width + (x + width) * eased;
          break;
        case 'slide-up':
          y = height + (y - height) * eased;
          break;
        case 'slide-down':
          y = -height + (y + height) * eased;
          break;
      }
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw shadow
    if (clip.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Draw stroke
    if (clip.stroke) {
      ctx.strokeStyle = clip.stroke;
      ctx.lineWidth = 4;
      ctx.strokeText(text, x, y);
    }

    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    ctx.restore();
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
      {!videosLoaded && (
        <div style={{
          position: 'absolute',
          color: '#888',
          fontSize: 13,
        }}>
          Loading assets...
        </div>
      )}
    </div>
  );
}
