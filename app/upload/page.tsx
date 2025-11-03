'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useDrafts, Draft } from '@/lib/use-drafts';
import { DraftsTab } from '@/components/DraftsTab';
import { NewUploadTab } from '@/components/NewUploadTab';
import Link from 'next/link';

type Tab = 'new' | 'drafts';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const { drafts, loading: draftsLoading, createDraft, updateDraft, deleteDraft, refetch } = useDrafts(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSelectDraft = (draft: Draft) => {
    setSelectedDraft(draft);
    setActiveTab('new');
  };

  const handlePublish = () => {
    refetch();
    setSelectedDraft(null);
    setActiveTab('new');
    router.push('/');
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
    if (selectedDraft?.id === draftId) {
      setSelectedDraft(null);
    }
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{ 
          marginBottom: 30, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
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
          Create Post
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 30,
          fontSize: 14,
        }}>
          Share your moment with the world
        </p>

        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <button
            onClick={() => {
              setActiveTab('new');
              setSelectedDraft(null);
            }}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'new' ? '2px solid rgba(212,175,55,0.8)' : '2px solid transparent',
              color: activeTab === 'new' ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.6)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'new') {
                e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'new') {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            New
          </button>

          <button
            onClick={() => {
              setActiveTab('drafts');
              setSelectedDraft(null);
            }}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'drafts' ? '2px solid rgba(212,175,55,0.8)' : '2px solid transparent',
              color: activeTab === 'drafts' ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.6)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'drafts') {
                e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'drafts') {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            Drafts
            {drafts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(212,175,55,0.8)',
                color: '#000',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {drafts.length}
              </span>
            )}
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {activeTab === 'new' ? (
            <NewUploadTab
              userId={user.id}
              onSaveDraft={createDraft}
              onUpdateDraft={updateDraft}
              onPublish={handlePublish}
              initialDraft={selectedDraft}
            />
          ) : (
            <DraftsTab
              drafts={drafts}
              loading={draftsLoading}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
            />
          )}
        </div>
      </div>
    </div>
  );
}
