//src/app/style/page.tsx
'use client';

import { useEffect } from 'react';
import styles from './StylePage.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TransitionWrapper from '@/components/TransitionWrapper';
import Cookies from 'js-cookie';
import Navigation from '@/components/Navigation';

const styleOptions = [
  'Daily',
  'Girly',
  'Sporty',
  'Streetwear',
  'Cocktail Party',
  'Formal',
];

export default function StylePage() {
  const router = useRouter();

  // ✅ Skip logic for admins or cookie missing
  useEffect(() => {
    const skip = sessionStorage.getItem('skipAdminRedirect') === 'true';
    const userAge = Cookies.get('userAge');

    if (!skip && !userAge) {
      router.push('/age');
    }

    // Cleanup old data
    Cookies.remove('styleOption');
    localStorage.removeItem('reportResult');
    localStorage.removeItem('generatedImageUrl');
  }, []);

  const handleStyleClick = (style: string) => {
    Cookies.set('preferredStyle', style, { expires: 1 }); // Save for 1 day
    router.push('/upload-image/selfie');
  };

  return (
    <TransitionWrapper>
      <div className="mobile-display">
        <div className={styles.container}>
          {/* Navigation */}
          <Navigation />

          {/* Top Bar */}
          <div className={styles.topBar}>
            <div className={styles.back} onClick={() => router.push('/age')}>
              &lt;
            </div>
          </div>

          {/* Heading */}
          <h2 className={styles.heading}>Your Style?</h2>

          {/* Options */}
          <div className={styles.card}>
            {styleOptions.map((style) => (
              <button
                key={style}
                className={styles.optionButton}
                onClick={() => handleStyleClick(style)}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Slogan */}
          <p className={styles.slogan}>
            Discover your seasonal color match through fashion.
          </p>
        </div>
      </div>
    </TransitionWrapper>
  );
}
