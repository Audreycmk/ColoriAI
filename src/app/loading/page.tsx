'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/report';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleVideoEnd = () => {
      // Keep video looping manually
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    };

    const startTimer = () => {
      // ⏳ Wait full 10 seconds before redirect
      timer = setTimeout(() => {
        router.push(returnTo);
      }, 10000); // 10s delay
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('ended', handleVideoEnd);
      videoRef.current.play();
    }

    startTimer();

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        videoRef.current.removeEventListener('ended', handleVideoEnd);
      }
    };
  }, [router, returnTo]);

  return (
    <div className="mobile-display">
      <video
        ref={videoRef}
        width="100%"
        autoPlay
        muted
        playsInline
        loop
      >
        <source src="/Analyzing.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
