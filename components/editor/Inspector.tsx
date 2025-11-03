'use client';

import { Clip } from './types';

interface InspectorProps {
  selectedClip: Clip | null;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onDeleteClip: (clipId: string) => void;
}

export function Inspector({ selectedClip, onUpdateClip, onDeleteClip }: InspectorProps) {
  if (!selectedClip) {
    return (
      <div style={{
        width: 280,
        borderLeft: '1px solid #333',
        background: '#111',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: 13,
      }}>
        Select a clip to edit
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    onUpdateClip(selectedClip.id, { [key]: value });
  };

  return (
    <div style={{
      width: 280,
      borderLeft: '1px solid #333',
      background: '#111',
      overflowY: 'auto',
    }}>
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          Inspector
        </h3>

        {/* Common Properties */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
            Duration (seconds)
          </label>
          <input
            type="number"
            value={selectedClip.duration}
            onChange={(e) => updateProp('duration', parseFloat(e.target.value))}
            step={0.1}
            min={0.1}
            style={{
              width: '100%',
              padding: 8,
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 4,
              color: '#fff',
              fontSize: 13,
            }}
          />
        </div>

        {/* Text Properties */}
        {selectedClip.type === 'text' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Text
              </label>
              <textarea
                value={selectedClip.text || ''}
                onChange={(e) => updateProp('text', e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Font Size
              </label>
              <input
                type="number"
                value={selectedClip.fontSize || 48}
                onChange={(e) => updateProp('fontSize', parseInt(e.target.value))}
                min={12}
                max={200}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Color
              </label>
              <input
                type="color"
                value={selectedClip.color || '#ffffff'}
                onChange={(e) => updateProp('color', e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  padding: 4,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Motion
              </label>
              <select
                value={selectedClip.motion || 'none'}
                onChange={(e) => updateProp('motion', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                }}
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
              </select>
            </div>
          </>
        )}

        {/* Video/Audio Properties */}
        {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={selectedClip.muted || false}
                  onChange={(e) => updateProp('muted', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Mute
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Volume
              </label>
              <input
                type="range"
                value={(selectedClip.volume || 1) * 100}
                onChange={(e) => updateProp('volume', parseInt(e.target.value) / 100)}
                min={0}
                max={100}
                disabled={selectedClip.muted}
                style={{
                  width: '100%',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Speed
              </label>
              <select
                value={selectedClip.speed || 1}
                onChange={(e) => updateProp('speed', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                }}
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </>
        )}

        {/* Effects */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
            Brightness
          </label>
          <input
            type="range"
            value={(selectedClip.effects.brightness || 1) * 100}
            onChange={(e) => updateProp('effects', { 
              ...selectedClip.effects, 
              brightness: parseInt(e.target.value) / 100 
            })}
            min={0}
            max={200}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
            Contrast
          </label>
          <input
            type="range"
            value={(selectedClip.effects.contrast || 1) * 100}
            onChange={(e) => updateProp('effects', { 
              ...selectedClip.effects, 
              contrast: parseInt(e.target.value) / 100 
            })}
            min={0}
            max={200}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 6 }}>
            Saturation
          </label>
          <input
            type="range"
            value={(selectedClip.effects.saturation || 1) * 100}
            onChange={(e) => updateProp('effects', { 
              ...selectedClip.effects, 
              saturation: parseInt(e.target.value) / 100 
            })}
            min={0}
            max={200}
            style={{ width: '100%' }}
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDeleteClip(selectedClip.id)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,59,48,0.2)',
            border: '1px solid rgba(255,59,48,0.4)',
            borderRadius: 6,
            color: '#ff3b30',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Delete Clip
        </button>
      </div>
    </div>
  );
}
