//src/app/age/page.tsx
'use client';

import styles from './AgePage.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TransitionWrapper from '@/components/TransitionWrapper';
import Cookies from 'js-cookie';
import Navigation from '@/components/Navigation';

const ageOptions = [
  'Under 18',
  '18 - 25',
  '26 - 35',
  '36 - 50',
  '50 +',
  'Prefer not to say',
];

export default function AgePage() {
  const router = useRouter();

  const handleAgeClick = (age: string) => {
    Cookies.set('userAge', age, { expires: 1 }); // Save for 1 day
    router.push('/style'); // No need to pass as query anymore
  };

  return (
    <TransitionWrapper>
      <div className="mobile-display">
        <div className={styles.container}>
          {/* Navigation */}
          <Navigation />

          {/* Top Bar */}
          <div className={styles.topBar}>
            <div className={styles.back} onClick={() => router.push('/')}>
              &lt;
            </div>
          </div>

          {/* Heading */}
          <h2 className={styles.heading}>Your Age?</h2>

          {/* Options */}
          <div className={styles.card}>
            {ageOptions.map((age) => (
              <button
                key={age}
                className={styles.optionButton}
                onClick={() => handleAgeClick(age)}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      </div>
    </TransitionWrapper>
  );
}
