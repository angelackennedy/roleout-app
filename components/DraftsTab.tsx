'use client';

import { Draft } from '@/lib/use-drafts';

interface DraftsTabProps {
  drafts: Draft[];
  loading: boolean;
  onSelectDraft: (draft: Draft) => void;
  onDeleteDraft: (draftId: string) => void;
}

export function DraftsTab({ drafts, loading, onSelectDraft, onDeleteDraft }: DraftsTabProps) {
  if (loading) {
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.6)',
      }}>
        Loading drafts...
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div style={{
        padding: 60,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16,
        }}>
          📝
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: 18,
          marginBottom: 8,
        }}>
          No drafts yet
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
        }}>
          Your saved drafts will appear here
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
      padding: 20,
    }}>
      {drafts.map((draft) => (
        <div
          key={draft.id}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <div
            onClick={() => onSelectDraft(draft)}
            style={{
              aspectRatio: '9/16',
              background: 'rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {draft.cover_url ? (
              <img
                src={draft.cover_url}
                alt="Draft cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : draft.video_url ? (
              <video
                src={draft.video_url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
              }}>
                🎬
              </div>
            )}
          </div>

          <div style={{ padding: 12 }}>
            <div style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: 40,
            }}>
              {draft.caption || 'No caption'}
            </div>

            {draft.hashtags && draft.hashtags.length > 0 && (
              <div style={{
                fontSize: 12,
                color: 'rgba(212,175,55,0.8)',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {draft.hashtags.join(' ')}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
            }}>
              <span>
                {new Date(draft.updated_at).toLocaleDateString()}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this draft?')) {
                    onDeleteDraft(draft.id);
                  }
                }}
                style={{
                  background: 'rgba(255,0,0,0.1)',
                  border: '1px solid rgba(255,0,0,0.3)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#ff6b6b',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
