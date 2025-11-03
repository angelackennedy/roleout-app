'use client';

import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { supabase } from '@/lib/supabase';
import { EditorProject, Asset, ExportSettings } from './types';
import { useRouter } from 'next/navigation';

interface ExportDialogProps {
  project: EditorProject;
  assets: Asset[];
  userId: string;
  onClose: () => void;
}

export function ExportDialog({ project, assets, userId, onClose }: ExportDialogProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    fps: 30,
    quality: 75,
    format: 'mp4',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const router = useRouter();

  const loadFFmpeg = async () => {
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });

    ffmpeg.on('progress', ({ progress: prog }) => {
      setProgress(Math.round(prog * 100));
    });

    setStatus('Loading FFmpeg...');
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    setStatus('FFmpeg loaded');
  };

  const exportWithMediaRecorder = async () => {
    setStatus('Quick export using MediaRecorder...');
    setIsExporting(true);

    try {
      // Create a canvas for composition
      const canvas = document.createElement('canvas');
      canvas.width = settings.resolution === '1080p' ? 1920 : 1280;
      canvas.height = settings.resolution === '1080p' ? 1080 : 720;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      // Capture canvas stream
      const stream = canvas.captureStream(settings.fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: settings.quality * 50000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadAndCreateDraft(blob);
      };

      mediaRecorder.start();

      // Render timeline
      const frameDuration = 1000 / settings.fps;
      let currentTime = 0;
      
      const renderFrame = () => {
        if (currentTime >= project.duration) {
          mediaRecorder.stop();
          return;
        }

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render clips (simplified)
        project.tracks.forEach(track => {
          track.clips.forEach(clip => {
            if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
              if (clip.type === 'text') {
                ctx.font = `${clip.fontSize || 48}px ${clip.fontFamily || 'Arial'}`;
                ctx.fillStyle = clip.color || '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(clip.text || 'Text', canvas.width / 2, canvas.height / 2);
              }
            }
          });
        });

        currentTime += frameDuration / 1000;
        setProgress(Math.round((currentTime / project.duration) * 100));
        setTimeout(renderFrame, frameDuration);
      };

      renderFrame();
    } catch (error) {
      console.error('Export error:', error);
      setStatus('Export failed');
      setIsExporting(false);
    }
  };

  const exportWithFFmpeg = async () => {
    setIsExporting(true);
    
    try {
      if (!ffmpegRef.current) {
        await loadFFmpeg();
      }

      const ffmpeg = ffmpegRef.current!;
      
      setStatus('Preparing files...');

      // For MVP, create a simple export
      // In a real implementation, this would process all clips and effects
      const videoClips = project.tracks
        .flatMap(t => t.clips)
        .filter(c => c.type === 'video');

      if (videoClips.length === 0) {
        throw new Error('No video clips to export');
      }

      // Load first video clip as example
      const firstClip = videoClips[0];
      const asset = assets.find(a => a.id === firstClip.assetId);
      
      if (!asset) throw new Error('Asset not found');

      setStatus('Loading video...');
      const videoData = await fetchFile(asset.url);
      await ffmpeg.writeFile('input.mp4', videoData);

      setStatus('Processing...');
      const height = settings.resolution === '1080p' ? 1080 : 720;
      
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', `scale=-2:${height}`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', String(51 - Math.round(settings.quality / 2)),
        '-c:a', 'aac',
        '-b:a', '128k',
        'output.mp4'
      ]);

      setStatus('Reading output...');
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });

      await uploadAndCreateDraft(blob);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('Export failed: ' + (error as Error).message);
      setIsExporting(false);
    }
  };

  const uploadAndCreateDraft = async (blob: Blob) => {
    try {
      setStatus('Uploading...');
      
      const filename = `export-${Date.now()}.mp4`;
      const filePath = `${userId}/${filename}`;

      // Upload to posts bucket
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, blob, {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      // Create draft post
      setStatus('Creating draft...');
      const { error: draftError } = await supabase
        .from('post_drafts')
        .insert({
          user_id: userId,
          video_url: urlData.publicUrl,
          caption: project.title,
          is_published: false,
        });

      if (draftError) throw draftError;

      setStatus('Export complete!');
      setProgress(100);
      
      setTimeout(() => {
        router.push('/drafts');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Upload failed: ' + (error as Error).message);
      setIsExporting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#111',
        borderRadius: 8,
        padding: 24,
        maxWidth: 500,
        width: '90%',
        border: '1px solid #333',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          Export Video
        </h2>

        {!isExporting ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>
                Resolution
              </label>
              <select
                value={settings.resolution}
                onChange={(e) => setSettings({ ...settings, resolution: e.target.value as '720p' | '1080p' })}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 14,
                }}
              >
                <option value="720p">720p (1280x720)</option>
                <option value="1080p">1080p (1920x1080)</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>
                Quality: {settings.quality}%
              </label>
              <input
                type="range"
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
                min={10}
                max={100}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={exportWithMediaRecorder}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(212,175,55,0.2)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  borderRadius: 6,
                  color: '#d4af37',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quick Export
              </button>
              <button
                onClick={exportWithFFmpeg}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Full Export (FFmpeg)
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: 12,
                background: 'transparent',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#888',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <div>
            <div style={{
              marginBottom: 12,
              fontSize: 13,
              color: '#aaa',
              textAlign: 'center',
            }}>
              {status}
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#222',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #d4af37 0%, #f4cf67 100%)',
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 12,
              color: '#666',
              textAlign: 'center',
            }}>
              {progress}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
