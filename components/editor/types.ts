export interface EditorProject {
  id: string | null;
  title: string;
  tracks: Track[];
  duration: number;
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'text' | 'sticker';
  clips: Clip[];
}

export interface Clip {
  id: string;
  assetId: string;
  type: 'video' | 'audio' | 'text' | 'sticker';
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  effects: ClipEffects;
  
  // Text-specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  stroke?: string;
  shadow?: string;
  position?: { x: number; y: number };
  motion?: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';
  
  // Video/Image-specific
  crop?: { x: number; y: number; width: number; height: number };
  rotation?: number;
  
  // Video/Audio-specific
  speed?: number;
  volume?: number;
  muted?: boolean;
  reversed?: boolean;
  
  // Transitions
  transitionIn?: 'none' | 'crossfade' | 'slide';
  transitionOut?: 'none' | 'crossfade' | 'slide';
  
  // Green screen
  chromaKey?: {
    enabled: boolean;
    color: string;
    tolerance: number;
  };
}

export interface ClipEffects {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  fadeIn?: number;
  fadeOut?: number;
  lut?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  duration?: number;
  thumbnail?: string;
}

export interface ExportSettings {
  resolution: '720p' | '1080p';
  fps: 30;
  quality: number; // 0-100
  format: 'mp4';
}
