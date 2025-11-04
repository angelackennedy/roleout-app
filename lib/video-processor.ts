import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading = false;
let ffmpegLoaded = false;

export interface ProcessingProgress {
  stage: 'loading' | 'extracting_thumbnail' | 'transcoding' | 'complete' | 'error';
  progress: number;
  message: string;
}

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance;
  }

  if (ffmpegLoading) {
    while (ffmpegLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpegInstance && ffmpegLoaded) {
      return ffmpegInstance;
    }
  }

  ffmpegLoading = true;

  try {
    const ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    ffmpegLoaded = true;
    return ffmpeg;
  } finally {
    ffmpegLoading = false;
  }
}

export async function extractThumbnail(
  videoFile: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<Blob | null> {
  try {
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Loading video processor...',
    });

    const ffmpeg = await loadFFmpeg();

    onProgress?.({
      stage: 'extracting_thumbnail',
      progress: 30,
      message: 'Extracting thumbnail...',
    });

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', 'select=eq(pict_type\\,I)',
      '-vframes', '1',
      '-q:v', '2',
      'thumbnail.jpg',
    ]);

    onProgress?.({
      stage: 'extracting_thumbnail',
      progress: 80,
      message: 'Finalizing thumbnail...',
    });

    const data = await ffmpeg.readFile('thumbnail.jpg');
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('thumbnail.jpg');

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Thumbnail extracted',
    });

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'image/jpeg' });
  } catch (error) {
    console.error('Thumbnail extraction failed:', error);
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Thumbnail extraction failed',
    });
    return null;
  }
}

export async function transcodeVideo(
  videoFile: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<Blob | null> {
  try {
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Loading video processor...',
    });

    const ffmpeg = await loadFFmpeg();

    onProgress?.({
      stage: 'transcoding',
      progress: 10,
      message: 'Transcoding video...',
    });

    ffmpeg.on('progress', ({ progress }) => {
      const percent = Math.round(progress * 100);
      onProgress?.({
        stage: 'transcoding',
        progress: 10 + percent * 0.8,
        message: `Transcoding... ${percent}%`,
      });
    });

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-profile:v', 'baseline',
      '-level', '3.0',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      'output.mp4',
    ]);

    onProgress?.({
      stage: 'transcoding',
      progress: 95,
      message: 'Finalizing video...',
    });

    const data = await ffmpeg.readFile('output.mp4');
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Video transcoded',
    });

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  } catch (error) {
    console.error('Video transcoding failed:', error);
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Transcoding failed',
    });
    return null;
  }
}

export async function processVideo(
  videoFile: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ video: Blob | null; thumbnail: Blob | null }> {
  try {
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Loading video processor...',
    });

    const ffmpeg = await loadFFmpeg();

    onProgress?.({
      stage: 'extracting_thumbnail',
      progress: 5,
      message: 'Extracting thumbnail...',
    });

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', 'select=eq(pict_type\\,I)',
      '-vframes', '1',
      '-q:v', '2',
      'thumbnail.jpg',
    ]);

    onProgress?.({
      stage: 'extracting_thumbnail',
      progress: 30,
      message: 'Thumbnail extracted',
    });

    const thumbnailData = await ffmpeg.readFile('thumbnail.jpg');
    const thumbnail = new Blob([new Uint8Array(thumbnailData as Uint8Array)], { type: 'image/jpeg' });
    await ffmpeg.deleteFile('thumbnail.jpg');

    onProgress?.({
      stage: 'transcoding',
      progress: 35,
      message: 'Transcoding video...',
    });

    ffmpeg.on('progress', ({ progress }) => {
      const percent = Math.round(progress * 100);
      onProgress?.({
        stage: 'transcoding',
        progress: 35 + percent * 0.6,
        message: `Transcoding... ${percent}%`,
      });
    });

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-profile:v', 'baseline',
      '-level', '3.0',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      'output.mp4',
    ]);

    onProgress?.({
      stage: 'transcoding',
      progress: 98,
      message: 'Finalizing...',
    });

    const videoData = await ffmpeg.readFile('output.mp4');
    const video = new Blob([new Uint8Array(videoData as Uint8Array)], { type: 'video/mp4' });

    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Processing complete',
    });

    return { video, thumbnail };
  } catch (error) {
    console.error('Video processing failed:', error);
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Processing failed',
    });
    // fallback to raw upload
    if (videoFile) {
      // Fallback: upload the original file if ffmpeg.wasm fails
      return { video: videoFile, thumbnail: null };
    }
    return { video: null, thumbnail: null };
  }
}

