'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTrendingHashtags } from '@/lib/use-trending-hashtags';
import { Draft } from '@/lib/use-drafts';
import { processVideo, ProcessingProgress } from '@/lib/video-processor';
import SoundPicker from '@/components/SoundPicker';

interface NewUploadTabProps {
  userId: string;
  onSaveDraft: (draftData: Partial<Draft>) => Promise<Draft | null>;
  onUpdateDraft: (draftId: string, updates: Partial<Draft>) => Promise<Draft | null>;
  onPublish: () => void;
  initialDraft?: Draft | null;
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  return matches.map((tag) => tag.toLowerCase());
}

async function captureCoverAtTime(videoElement: HTMLVideoElement, time: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const seekHandler = () => {
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      } else {
        resolve(null);
      }
      videoElement.removeEventListener('seeked', seekHandler);
    };

    videoElement.addEventListener('seeked', seekHandler);
    videoElement.currentTime = time;
  });
}

export function NewUploadTab({ 
  userId, 
  onSaveDraft, 
  onUpdateDraft, 
  onPublish,
  initialDraft 
}: NewUploadTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initialDraft?.video_url || '');
  const [caption, setCaption] = useState(initialDraft?.caption || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(initialDraft || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [coverUrl, setCoverUrl] = useState<string | null>(initialDraft?.cover_url || null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverTime, setCoverTime] = useState(1);
  const [processedVideo, setProcessedVideo] = useState<Blob | null>(null);
  const [processedThumbnail, setProcessedThumbnail] = useState<Blob | null>(null);
  const [skipProcessing, setSkipProcessing] = useState(false);
  const skipProcessingRef = useRef(false);
  const [selectedSound, setSelectedSound] = useState<{ id: string; file_url: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { trendingTags } = useTrendingHashtags(10);

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
    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
    setError(null);
    setProcessedVideo(null);
    setProcessedThumbnail(null);
    setSkipProcessing(false);
    skipProcessingRef.current = false;
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

  const saveDraft = useCallback(async () => {
    if (!caption.trim() && !file && !preview) return;

    setAutoSaveStatus('saving');

    try {
      let videoUrl = currentDraft?.video_url || preview;
      let coverUrlToSave = currentDraft?.cover_url || coverUrl;

      if (file && !currentDraft?.video_url) {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const videoPath = `${userId}/${timestamp}-draft.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(videoPath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(videoPath);
        videoUrl = urlData.publicUrl;
      }

      const hashtags = extractHashtags(caption);

      if (currentDraft) {
        const updated = await onUpdateDraft(currentDraft.id, {
          caption: caption.trim() || null,
          hashtags: hashtags.length > 0 ? hashtags : null,
          cover_url: coverUrlToSave,
        });
        if (updated) {
          setCurrentDraft(updated);
        }
      } else {
        const newDraft = await onSaveDraft({
          video_url: videoUrl,
          cover_url: coverUrlToSave,
          caption: caption.trim() || null,
          hashtags: hashtags.length > 0 ? hashtags : null,
        });
        if (newDraft) {
          setCurrentDraft(newDraft);
        }
      }

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error('Autosave error:', err);
      setAutoSaveStatus('idle');
    }
  }, [caption, file, preview, currentDraft, onSaveDraft, onUpdateDraft, userId, coverUrl]);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [caption, saveDraft]);

  const handlePublish = async () => {
    if (!preview && !currentDraft?.video_url && !file) {
      setError('Please select a video');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let videoToUpload: File | Blob | null = file;
      let thumbnailToUpload: Blob | null = null;

      skipProcessingRef.current = false;

      if (file && !skipProcessing && !processedVideo) {
        setProcessingProgress({ stage: 'loading', progress: 0, message: 'Starting processing...' });

        const processingPromise = processVideo(file, (progress) => {
          if (skipProcessingRef.current) {
            return;
          }
          setProcessingProgress(progress);
        }).then((result) => {
          if (result.video && result.thumbnail) {
            setProcessedVideo(result.video);
            setProcessedThumbnail(result.thumbnail);
          }
          return result;
        }).catch((err) => {
          console.error('Background processing error:', err);
          return { video: null, thumbnail: null };
        });

        const skipCheck = new Promise<{ video: null; thumbnail: null }>((resolve) => {
          const checkInterval = setInterval(() => {
            if (skipProcessingRef.current) {
              clearInterval(checkInterval);
              resolve({ video: null, thumbnail: null });
            }
          }, 100);
          
          processingPromise.finally(() => clearInterval(checkInterval));
        });

        const result = await Promise.race([processingPromise, skipCheck]);

        if (skipProcessingRef.current || !result.video) {
          videoToUpload = file;
          setProcessingProgress(null);
        } else if (result.video && result.thumbnail) {
          videoToUpload = result.video;
          thumbnailToUpload = result.thumbnail;
          setProcessingProgress(null);
        } else {
          videoToUpload = file;
          setProcessingProgress(null);
        }
      } else if (processedVideo) {
        videoToUpload = processedVideo;
        thumbnailToUpload = processedThumbnail;
      }
      setUploadProgress(5);

      const hashtags = extractHashtags(caption);

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          caption: caption.trim() || null,
          hashtags: hashtags.length > 0 ? hashtags : null,
          sound_id: selectedSound?.id || null,
        })
        .select('id')
        .single();

      if (postError) throw postError;

      const postId = postData.id;

      setUploadProgress(20);

      const videoPath = `${userId}/${postId}.mp4`;
      const videoBlob = videoToUpload || file;
      
      if (!videoBlob) throw new Error('No video to upload');

      const { error: videoError } = await supabase.storage
        .from('posts')
        .upload(videoPath, videoBlob, {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) throw videoError;

      setUploadProgress(60);

      const { data: videoUrlData } = supabase.storage.from('posts').getPublicUrl(videoPath);
      const videoUrl = videoUrlData.publicUrl;

      let coverUrl: string | null = null;

      if (thumbnailToUpload) {
        const coverPath = `${userId}/${postId}.jpg`;
        const { error: coverError } = await supabase.storage
          .from('posts')
          .upload(coverPath, thumbnailToUpload, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (!coverError) {
          const { data: coverUrlData } = supabase.storage.from('posts').getPublicUrl(coverPath);
          coverUrl = coverUrlData.publicUrl;
        }
      }

      setUploadProgress(90);

      const { error: updateError } = await supabase
        .from('posts')
        .update({
          video_url: videoUrl,
          cover_url: coverUrl,
        })
        .eq('id', postId);

      if (updateError) throw updateError;

      if (currentDraft) {
        await supabase.from('post_drafts').delete().eq('id', currentDraft.id);
      }

      setUploadProgress(100);
      
      setSkipProcessing(false);
      skipProcessingRef.current = false;
      
      onPublish();
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Publish failed');
      setUploadProgress(0);
      setProcessingProgress(null);
    } finally {
      setUploading(false);
      setSkipProcessing(false);
      skipProcessingRef.current = false;
    }
  };

  const insertHashtag = (tag: string) => {
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    setCaption((prev) => (prev ? `${prev} ${formattedTag}` : formattedTag));
  };

  const handleCaptureCover = async () => {
    if (!videoRef.current) return;

    try {
      const blob = await captureCoverAtTime(videoRef.current, coverTime);
      if (!blob) throw new Error('Failed to capture frame');

      const timestamp = Date.now();
      const coverPath = `${userId}/${timestamp}-cover.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(coverPath, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(coverPath);
      setCoverUrl(urlData.publicUrl);
      setShowCoverPicker(false);
    } catch (err: any) {
      console.error('Cover capture error:', err);
      setError('Failed to capture cover');
    }
  };

  const hashtags = extractHashtags(caption);

  const isProcessing = processingProgress !== null && processingProgress.stage !== 'complete';
  const canSkipProcessing = isProcessing && processingProgress?.progress < 50;

  return (
    <div style={{ padding: 20 }}>
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

      {processingProgress && (
        <div style={{
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 14,
            color: 'rgba(212,175,55,0.9)',
            marginBottom: 8,
          }}>
            {processingProgress.message}
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${processingProgress.progress}%`,
              height: '100%',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(255,215,0,0.6) 100%)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          {canSkipProcessing && (
            <button
              onClick={() => {
                skipProcessingRef.current = true;
                setSkipProcessing(true);
                setProcessingProgress(null);
              }}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Skip Processing
            </button>
          )}
        </div>
      )}

      {!preview ? (
        <div
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
            Click or drag video here
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            Max 100MB
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
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 20,
            maxWidth: 400,
            margin: '0 auto 20px',
          }}>
            <video
              ref={videoRef}
              src={preview}
              controls
              style={{ width: '100%', display: 'block', borderRadius: 12 }}
            />
            {coverUrl && (
              <div style={{
                marginTop: 10,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
              }}>
                ✓ Cover selected
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCoverPicker(!showCoverPicker)}
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 8,
              color: 'rgba(212,175,55,0.9)',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            {showCoverPicker ? 'Hide Cover Picker' : 'Pick Cover Frame'}
          </button>

          {showCoverPicker && videoRef.current && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ marginBottom: 12, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                Scrub to select frame: {coverTime.toFixed(1)}s
              </div>
              <input
                type="range"
                min="0"
                max={videoRef.current.duration || 10}
                step="0.1"
                value={coverTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  setCoverTime(time);
                  if (videoRef.current) {
                    videoRef.current.currentTime = time;
                  }
                }}
                style={{ width: '100%', marginBottom: 12 }}
              />
              <button
                onClick={handleCaptureCover}
                style={{
                  width: '100%',
                  padding: 10,
                  background: 'rgba(212,175,55,0.2)',
                  border: '1px solid rgba(212,175,55,0.5)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Capture This Frame
              </button>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <label style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                Caption
              </label>
              {autoSaveStatus === 'saving' && (
                <span style={{ fontSize: 12, color: 'rgba(212,175,55,0.8)' }}>
                  Saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span style={{ fontSize: 12, color: '#51cf66' }}>
                  ✓ Saved
                </span>
              )}
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... use #hashtags"
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            {hashtags.length > 0 && (
              <div style={{
                marginTop: 8,
                fontSize: 12,
                color: 'rgba(212,175,55,0.8)',
              }}>
                Tags: {hashtags.join(' ')}
              </div>
            )}
          </div>

          {trendingTags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 8,
              }}>
                🔥 Trending Tags
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => insertHashtag(tag)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 16,
                      color: 'rgba(212,175,55,0.9)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(212,175,55,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <audio ref={audioRef} className="hidden" />
            <SoundPicker
              selectedSoundId={selectedSound?.id || null}
              onSelectSound={(sound) => setSelectedSound(sound)}
              audioRef={audioRef}
            />
          </div>

          {uploading && uploadProgress > 0 && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}>
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 8,
              }}>
                Uploading... {uploadProgress}%
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(255,215,0,0.6) 100%)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={uploading || isProcessing}
            style={{
              width: '100%',
              padding: 16,
              background: (uploading || isProcessing)
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(255,215,0,0.6) 100%)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: (uploading || isProcessing) ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessing ? 'Processing...' : uploading ? `Publishing... ${uploadProgress}%` : 'Publish'}
          </button>
        </div>
      )}
    </div>
  );
}
