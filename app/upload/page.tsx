'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  return matches.map(tag => tag.toLowerCase());
}

async function captureCoverImage(videoFile: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    video.addEventListener('seeked', () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          resolve(blob);
        }, 'image/jpeg', 0.8);
      } else {
        resolve(null);
      }
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    });

    video.src = URL.createObjectURL(videoFile);
    video.currentTime = 1;
  });
}

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('Video must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    setSuccess(false);

    const cover = await captureCoverImage(selectedFile);
    setCoverBlob(cover);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!user || !file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const videoPath = `${user.id}/${timestamp}.${fileExt}`;
      
      setProgress(10);

      const { data: videoData, error: videoError } = await supabase.storage
        .from('posts')
        .upload(videoPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) {
        throw new Error(`Video upload failed: ${videoError.message}`);
      }

      setProgress(50);

      const { data: videoUrlData } = supabase.storage
        .from('posts')
        .getPublicUrl(videoPath);

      const videoUrl = videoUrlData.publicUrl;
      let coverUrl = null;

      if (coverBlob) {
        const coverPath = `${user.id}/${timestamp}-cover.jpg`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('posts')
          .upload(coverPath, coverBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (!coverError) {
          const { data: coverUrlData } = supabase.storage
            .from('posts')
            .getPublicUrl(coverPath);
          coverUrl = coverUrlData.publicUrl;
        }
      }

      setProgress(70);

      const hashtags = extractHashtags(caption);

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          cover_url: coverUrl,
          caption: caption.trim() || null,
          hashtags: hashtags.length > 0 ? hashtags : null,
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setProgress(100);
      setSuccess(true);

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview('');
    setCaption('');
    setProgress(0);
    setError(null);
    setSuccess(false);
    setCoverBlob(null);
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hashtags = extractHashtags(caption);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{
            color: 'rgba(212,175,55,0.8)',
            fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
          }}>
            ← Back to Feed
          </Link>
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 10,
          background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Upload Video
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 30,
          fontSize: 14,
        }}>
          Share your moment with the world
        </p>

        {error && (
          <div style={{
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: '#ff6b6b',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(0,255,0,0.1)',
            border: '1px solid rgba(0,255,0,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: '#51cf66',
            fontSize: 14,
          }}>
            ✅ Upload successful! Redirecting...
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 30,
          marginBottom: 20,
        }}>
          {!file ? (
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(212,175,55,0.5)',
                borderRadius: 12,
                padding: 60,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'rgba(212,175,55,0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.05)';
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Click or drag to upload
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                MP4, MOV, WebM • Max 100MB
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              <div style={{
                position: 'relative',
                marginBottom: 20,
              }}>
                <video
                  src={preview}
                  controls
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    background: '#000',
                    maxHeight: 500,
                  }}
                />
                {!uploading && (
                  <button
                    onClick={resetForm}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Change Video
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'rgba(255,255,255,0.9)',
                }}>
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption... Use #hashtags"
                  maxLength={300}
                  rows={4}
                  disabled={uploading}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: 'white',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  <div>
                    {hashtags.length > 0 && (
                      <span>
                        Tags: {hashtags.map(tag => tag).join(' ')}
                      </span>
                    )}
                  </div>
                  <div>{caption.length}/300</div>
                </div>
              </div>

              {uploading && (
                <div style={{
                  marginBottom: 20,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: 16,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: 14,
                  }}>
                    <span>{success ? '✅ Upload complete!' : 'Uploading...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.8) 100%)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || success}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: uploading || success
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.4) 100%)',
                  border: '1px solid rgba(212,175,55,0.5)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: uploading || success ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!uploading && !success) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.7) 0%, rgba(212,175,55,0.5) 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploading && !success) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.4) 100%)';
                  }
                }}
              >
                {uploading ? 'Uploading...' : success ? '✅ Posted!' : 'Post'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
