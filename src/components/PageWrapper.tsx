//src/components/PageWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsVisible(false); // Start invisible
    const timeout = setTimeout(() => {
      setIsVisible(true); // Then fade in
    }, 10); // Slight delay to trigger animation

    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 600ms linear',
      }}
    >
      {children}
    </div>
  );
}
