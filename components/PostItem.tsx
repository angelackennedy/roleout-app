'use client';

import React, { ReactNode } from 'react';
import { useImpressions } from '@/lib/hooks/useImpressions';

interface PostItemProps {
  postId: string;
  userId: string | null;
  children: ReactNode;
  onRefAssign?: (el: HTMLDivElement | null, postId: string) => void;
  className?: string;
  style?: React.CSSProperties;
  dataPostId?: string;
}

export function PostItem({
  postId,
  userId,
  children,
  onRefAssign,
  className,
  style,
  dataPostId,
}: PostItemProps) {
  const { elementRef } = useImpressions({
    postId,
    userId,
    enabled: !!userId,
  });

  const handleRef = (el: HTMLDivElement | null) => {
    // Assign the impression tracking ref
    if (elementRef) {
      elementRef.current = el;
    }
    
    // Call the parent's ref callback if provided (both for el and null for cleanup)
    if (onRefAssign) {
      onRefAssign(el, postId);
    }
  };

  return (
    <div
      ref={handleRef}
      className={className}
      style={style}
      data-post-id={dataPostId || postId}
    >
      {children}
    </div>
  );
}
