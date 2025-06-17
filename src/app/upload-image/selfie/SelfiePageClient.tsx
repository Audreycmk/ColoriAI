'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SelfiePage.module.css';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Cookies from 'js-cookie';

export default function SelfiePageClient() {
  const router = useRouter();

  const [userSelectedAge, setUserSelectedAge] = useState<string | undefined>(undefined);
  const [userPreferredStyle, setUserPreferredStyle] = useState<string | undefined>(undefined);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    setImageFile(file);
  };

  const handleContinue = async () => {
    if (!imageSrc) {
      console.error('❌ No image selected to continue.');
      return;
    }

    setLoading(true);

    const redirectParams = new URLSearchParams({
      age: userSelectedAge || '',
      style: userPreferredStyle || '',
      returnTo: '/report',
    }).toString();

    router.push(`/loading?${redirectParams}`);

    try {
      const promptRes = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          age: userSelectedAge,
          style: userPreferredStyle,
        }),
      });

      if (!promptRes.ok) {
        const errorText = await promptRes.text();
        console.error('❌ Gemini API Error Response:', errorText);
        throw new Error(`Gemini API failed: ${errorText}`);
      }

      const { result } = await promptRes.json();
      console.log('🧠 Gemini Result:', result);

      const match = result.match(/\*\*Image Prompt:\*\*\s*(.+)/);
      const imagePrompt = match?.[1]?.trim();

      if (!imagePrompt || imagePrompt.length < 10) {
        router.push('/error?message=Could not generate style prompt. Please try again.');
        return;
      }

      const imageGenRes = await fetch('/api/generate-and-upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt }),
      });

      if (!imageGenRes.ok) {
        const errorText = await imageGenRes.text();
        throw new Error(`Image generation/upload failed: ${errorText}`);
      }

      const { imageUrl } = await imageGenRes.json();
      console.log('🖼️ Cloudinary Image URL:', imageUrl);

      localStorage.setItem('reportResult', result);
      localStorage.setItem('generatedImageUrl', imageUrl);

      router.push('/report');
    } catch (err) {
      console.error('❌ handleContinue error:', err);
      setLoading(false);
      router.push(`/error?message=${(err as Error).message || 'Unknown error'}`);
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
                setImageFile(null);
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
