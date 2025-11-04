import { useEffect, useRef, useState } from 'react';
import { trackImpression, shouldTrackImpression } from '../impressions';

interface UseImpressionsProps {
  postId: string;
  userId: string | null;
  enabled?: boolean;
}

export function useImpressions({ postId, userId, enabled = true }: UseImpressionsProps) {
  const [tracked, setTracked] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackedPostsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !userId || !elementRef.current || tracked) {
      return;
    }

    const element = elementRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            // Video is 60% visible - start the timer
            if (!timeoutRef.current && shouldTrackImpression(postId, trackedPostsRef.current)) {
              timeoutRef.current = setTimeout(async () => {
                // Record impression after 2 seconds
                const success = await trackImpression({
                  postId,
                  userId,
                  msWatched: 2000,
                });

                if (success) {
                  trackedPostsRef.current.add(postId);
                  setTracked(true);
                }

                timeoutRef.current = null;
              }, 2000);
            }
          } else {
            // Video is less than 60% visible - clear the timer
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        });
      },
      {
        threshold: [0.0, 0.6, 1.0],
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [postId, userId, enabled, tracked]);

  return { elementRef, tracked };
}
