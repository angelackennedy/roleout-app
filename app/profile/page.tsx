'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(`/profile/${user.id}`);
    } else {
      router.push('/auth/login');
    }
  }, [user, router]);

  return null;
}
