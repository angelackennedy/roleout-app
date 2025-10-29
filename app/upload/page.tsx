'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function UploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setTrimEnd(Math.min(videoDuration, 60));
    }
  };

  const trimVideo = async (): Promise<Blob | null> => {
    if (!videoFile || !videoRef.current) return null;

    const trimDuration = trimEnd - trimStart;
    if (trimDuration > 60) {
      setError('Video cannot be longer than 60 seconds');
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    const chunks: Blob[] = [];
    
    return new Promise((resolve) => {
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      video.currentTime = trimStart;
      
      video.onseeked = () => {
        mediaRecorder.start();
        
        const interval = setInterval(() => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          if (video.currentTime >= trimEnd) {
            clearInterval(interval);
            mediaRecorder.stop();
          }
        }, 1000 / 30);

        video.play();
      };
    });
  };

  const handleUpload = async () => {
    if (!user || !videoFile) return;

    setUploading(true);
    setError('');

    try {
      let uploadBlob: Blob = videoFile;
      
      if (trimEnd - trimStart < duration) {
        const trimmedBlob = await trimVideo();
        if (!trimmedBlob) {
          throw new Error('Failed to trim video');
        }
        uploadBlob = trimmedBlob;
      }

      const finalDuration = trimEnd - trimStart;
      if (finalDuration > 60) {
        setError('Video must be 60 seconds or less');
        setUploading(false);
        return;
      }

      const fileName = `${user.id}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, uploadBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          caption: caption || null,
        });

      if (insertError) throw insertError;

      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Video File
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {videoUrl && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preview & Trim (max 60 seconds)
                </label>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg bg-black"
                  controls
                  onLoadedMetadata={handleLoadedMetadata}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Trim Start: {trimStart.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Trim End: {trimEnd.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Final duration: {(trimEnd - trimStart).toFixed(1)}s
                  {trimEnd - trimStart > 60 && (
                    <span className="text-red-600"> (exceeds 60s limit)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Add a caption..."
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!videoFile || uploading || trimEnd - trimStart > 60}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
