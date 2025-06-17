'use client';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 10); // small delay to trigger animation
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transition: 'opacity 600ms linear',
      }}
    >
      {children}
    </div>
  );
}
