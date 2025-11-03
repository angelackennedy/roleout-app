'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AssetsPanel } from './AssetsPanel';
import { PreviewCanvas } from './PreviewCanvas';
import { Timeline } from './Timeline';
import { Inspector } from './Inspector';
import { ExportDialog } from './ExportDialog';
import { EditorProject, Track, Clip, Asset } from './types';

interface VideoEditorProps {
  userId: string;
}

export function VideoEditor({ userId }: VideoEditorProps) {
  const [project, setProject] = useState<EditorProject>({
    id: null,
    title: 'Untitled Project',
    tracks: [],
    duration: 0,
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save project
  const saveProject = useCallback(async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const projectData = {
        title: project.title,
        tracks: project.tracks,
        duration: project.duration,
      };

      if (project.id) {
        // Update existing project
        await supabase
          .from('editor_projects')
          .update({ 
            project_data: projectData,
            title: project.title,
          })
          .eq('id', project.id);
      } else {
        // Create new project
        const { data } = await supabase
          .from('editor_projects')
          .insert({
            user_id: userId,
            title: project.title,
            project_data: projectData,
          })
          .select()
          .single();
        
        if (data) {
          setProject(prev => ({ ...prev, id: data.id }));
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  }, [project, userId]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveProject();
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [project, saveProject]);

  // Load user assets
  useEffect(() => {
    loadAssets();
  }, [userId]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('editor')
        .list(`${userId}/`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      const loadedAssets: Asset[] = (data || []).map(file => ({
        id: file.id,
        name: file.name,
        type: getAssetType(file.name),
        url: supabase.storage.from('editor').getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
        duration: 0,
      }));

      setAssets(loadedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const getAssetType = (filename: string): 'video' | 'audio' | 'image' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return 'video';
    if (['mp3', 'm4a', 'wav', 'ogg'].includes(ext || '')) return 'audio';
    return 'image';
  };

  const addClipToTrack = (asset: Asset, trackType: 'video' | 'audio' | 'text') => {
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      assetId: asset.id,
      type: trackType,
      startTime: currentTime,
      duration: asset.duration || 5,
      trimStart: 0,
      trimEnd: asset.duration || 5,
      effects: {},
    };

    setProject(prev => {
      const tracks = [...prev.tracks];
      let track = tracks.find(t => t.type === trackType);
      
      if (!track) {
        track = {
          id: `track-${trackType}-${Date.now()}`,
          type: trackType,
          clips: [],
        };
        tracks.push(track);
      }
      
      track.clips.push(newClip);
      
      return {
        ...prev,
        tracks,
        duration: Math.max(prev.duration, newClip.startTime + newClip.duration),
      };
    });
  };

  const updateClip = (clipId: string, updates: Partial<Clip>) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      })),
    }));
  };

  const deleteClip = (clipId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== clipId),
      })),
    }));
    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{
        height: 60,
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: '#111',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            {project.title}
          </h1>
          {isSaving && (
            <span style={{ fontSize: 12, color: '#888' }}>Saving...</span>
          )}
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
            border: 'none',
            borderRadius: 6,
            padding: '10px 24px',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Assets Panel */}
        <AssetsPanel
          assets={assets}
          onAddAsset={loadAssets}
          onAddClip={addClipToTrack}
          userId={userId}
        />

        {/* Center: Preview & Inspector */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex' }}>
            <PreviewCanvas
              project={project}
              currentTime={currentTime}
              isPlaying={isPlaying}
              assets={assets}
            />
            <Inspector
              selectedClip={selectedClip}
              onUpdateClip={updateClip}
              onDeleteClip={deleteClip}
            />
          </div>

          {/* Bottom: Timeline */}
          <Timeline
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            selectedClip={selectedClip}
            onTimeChange={setCurrentTime}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onSelectClip={setSelectedClip}
            onUpdateClip={updateClip}
            onDeleteClip={deleteClip}
          />
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          project={project}
          assets={assets}
          userId={userId}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
