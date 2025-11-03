'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset } from './types';

interface AssetsPanelProps {
  assets: Asset[];
  onAddAsset: () => void;
  onAddClip: (asset: Asset, trackType: 'video' | 'audio' | 'text') => void;
  userId: string;
}

export function AssetsPanel({ assets, onAddAsset, onAddClip, userId }: AssetsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'text' | 'stickers'>('media');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `${userId}/${Date.now()}-${file.name}`;
        await supabase.storage.from('editor').upload(filePath, file);
      }
      onAddAsset();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addTextClip = () => {
    const textAsset: Asset = {
      id: `text-${Date.now()}`,
      name: 'Text',
      type: 'image',
      url: '',
      duration: 5,
    };
    onAddClip(textAsset, 'text');
  };

  return (
    <div style={{
      width: 280,
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      background: '#111',
    }}>
      <div style={{
        padding: 16,
        borderBottom: '1px solid #333',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Assets</h2>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['media', 'text', 'stickers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '6px 12px',
                background: activeTab === tab ? '#333' : 'transparent',
                border: '1px solid #444',
                borderRadius: 4,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'media' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '10px',
              background: uploading ? '#333' : 'rgba(212,175,55,0.2)',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 6,
              color: uploading ? '#888' : '#d4af37',
              fontSize: 13,
              fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : '+ Upload Media'}
          </button>
        )}

        {activeTab === 'text' && (
          <button
            onClick={addTextClip}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(212,175,55,0.2)',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 6,
              color: '#d4af37',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Add Text
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Assets List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
      }}>
        {activeTab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assets.map(asset => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('asset', JSON.stringify(asset));
                }}
                style={{
                  padding: 12,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 6,
                  cursor: 'grab',
                }}
              >
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {asset.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#888',
                }}>
                  {asset.type}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stickers' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {['😀', '😂', '❤️', '👍', '🔥', '⭐', '🎉', '✨'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  const stickerAsset: Asset = {
                    id: `emoji-${Date.now()}`,
                    name: emoji,
                    type: 'image',
                    url: '',
                    duration: 5,
                  };
                  onAddClip(stickerAsset, 'text');
                }}
                style={{
                  padding: 12,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 6,
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
