'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SelfiePage.module.css';
import Navigation from '@/components/Navigation';
import Cookies from 'js-cookie';

export default function SelfiePageClient() {
  const router = useRouter();

  const [userSelectedAge, setUserSelectedAge] = useState<string | undefined>(undefined);
  const [userPreferredStyle, setUserPreferredStyle] = useState<string | undefined>(undefined);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Read cookies and skip check for admins
  useEffect(() => {
    const skip = sessionStorage.getItem('skipAdminRedirect') === 'true';
    const ageFromCookie = Cookies.get('userAge');
    const styleFromCookie = Cookies.get('preferredStyle');

    if (!skip && (!ageFromCookie || !styleFromCookie)) {
      console.warn('🚫 Missing cookies. Redirecting to /age...');
      router.push('/age');
      return;
    }

    if (ageFromCookie) {
      setUserSelectedAge(ageFromCookie);
      console.log('🍪 Cookie - userAge:', ageFromCookie);
    }

    if (styleFromCookie) {
      setUserPreferredStyle(styleFromCookie);
      console.log('🍪 Cookie - preferredStyle:', styleFromCookie);
    }

    // Clear any existing report data when starting a new test
    localStorage.removeItem('reportResult');
    localStorage.removeItem('generatedImageUrl');
    localStorage.removeItem('generatedOutfitImage');
    console.log('🧹 Cleared existing report data for new test');
  }, [router]);

  const handleClickChooseAgain = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleContinue = async () => {
    if (!imageSrc) {
      console.error('❌ No image selected to continue.');
      return;
    }

    setLoading(true);

    try {
      // Store the image data in localStorage for the loading page
      localStorage.setItem('pendingImageAnalysis', imageSrc);
      localStorage.setItem('pendingAge', userSelectedAge || '');
      localStorage.setItem('pendingStyle', userPreferredStyle || '');

      // Redirect to loading page immediately
      router.push('/loading');

      // The loading page will handle the actual analysis and image generation
    } catch (error) {
      console.error('Error:', error);
      router.push('/error?message=An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-display">
      <div
        className={`${styles.container} ${
          imageSrc ? styles.confirmBackground : styles.uploadBackground
        }`}
      >
        <Navigation />

        <div className={styles.topBar}>
          <div
            className={styles.back}
            onClick={() => {
              if (imageSrc) {
                setImageSrc(null);
              } else {
                router.back();
              }
            }}
          >
            &lt;
          </div>
        </div>

        <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />

        {!imageSrc && <h2 className={styles.heading}>Upload a photo</h2>}

        {imageSrc ? (
          <>
            <div className={styles.photoContainer}>
              <img
                src={imageSrc}
                alt="Selected"
                className={`${styles.photoPreview} ${styles.fadeIn}`}
              />
            </div>
            <button className={styles.chooseAgainBtn} onClick={handleClickChooseAgain}>
              Choose Again
            </button>
            <button className={styles.continueBtn} onClick={handleContinue} disabled={loading}>
              {loading ? 'ANALYZING...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <label className={styles.cameraCircle} onClick={handleClickChooseAgain}>
              <img src="/Camera.svg" alt="Camera Icon" />
            </label>
            <button className={styles.uploadBtn} onClick={handleClickChooseAgain}>
              Choose a photo
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />
      </div>
    </div>
  );
}
