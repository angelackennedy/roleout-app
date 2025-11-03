'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { VideoEditor } from '@/components/editor/VideoEditor';

export default function EditorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: 'white',
      }}>
        <div>Loading editor...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <VideoEditor userId={user.id} />;
}
