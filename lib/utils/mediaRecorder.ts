// MediaRecorder utility with mimeType fallbacks

export interface RecorderMimeType {
  mimeType: string;
  fileExtension: string;
}

/**
 * Get the best supported mimeType for MediaRecorder
 * Tries in order: VP9 > VP8 > plain WebM
 */
export function getSupportedMimeType(): RecorderMimeType {
  const mimeTypes = [
    { mimeType: 'video/webm;codecs=vp9', fileExtension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', fileExtension: 'webm' },
    { mimeType: 'video/webm', fileExtension: 'webm' },
  ];

  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type.mimeType)) {
      console.log('Using mimeType:', type.mimeType);
      return type;
    }
  }

  // Fallback to default
  console.warn('No preferred mimeType supported, using default');
  return { mimeType: '', fileExtension: 'webm' };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
