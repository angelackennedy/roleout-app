import { useEffect, useRef } from 'react';

interface UseVideoPreloadProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  index: number;
  currentIndex: number;
}

export function useVideoPreload({
  videoRef,
  index,
  currentIndex,
}: UseVideoPreloadProps) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Calculate if this video should be preloaded or played
    const distanceFromCurrent = index - currentIndex;
    const shouldPreload = distanceFromCurrent >= 0 && distanceFromCurrent <= 2;

    // Preload upcoming videos (current + next 2)
    if (shouldPreload) {
      video.preload = 'auto';
      video.load();
    } else {
      video.preload = 'none';
    }

    // Setup IntersectionObserver for play/pause
    // Store in local const to ensure cleanup disposes the correct observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Video is at least 50% visible - play it
            videoElement.play().catch(() => {
              // Silently handle autoplay failures
            });
          } else {
            // Video is off-screen or mostly hidden - pause it
            videoElement.pause();
          }
        });
      },
      {
        threshold: [0, 0.5, 1.0],
        rootMargin: '100px 0px', // Start preloading 100px before entering viewport
      }
    );

    observer.observe(video);

    return () => {
      // Cleanup: dispose the correct observer instance
      observer.unobserve(video);
      observer.disconnect();
    };
  }, [videoRef, index, currentIndex]);

  // Pause videos that are far from current index
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const distanceFromCurrent = Math.abs(index - currentIndex);
    
    // Pause videos that are more than 2 positions away
    if (distanceFromCurrent > 2) {
      video.pause();
      video.preload = 'none';
    }
  }, [currentIndex, index, videoRef]);
}
