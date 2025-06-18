'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoadingPage.module.css';

export default function LoadingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const processImage = async () => {
      try {
        // Get stored data
        const imageSrc = localStorage.getItem('pendingImageAnalysis');
        const age = localStorage.getItem('pendingAge');
        const style = localStorage.getItem('pendingStyle');

        if (!imageSrc) {
          throw new Error('No image data found');
        }

        // Step 1: Gemini Analysis (0-50%)
        setProgress(10);
        const promptRes = await fetch('/api/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageSrc,
            age,
            style,
          }),
        });

        if (!promptRes.ok) {
          throw new Error('Gemini analysis failed');
        }

        const { result } = await promptRes.json();
        console.log('Gemini Response:', result);
        setProgress(50);
        
        // Remove URLs from the result before storing
        const cleanedResult = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
        localStorage.setItem('reportResult', cleanedResult);

        // Step 2: DALL-E Image Generation (50-100%)
        const match = cleanedResult.match(/\*\*Image Prompt:\*\*\s*(.+)/);
        const imagePrompt = match?.[1]?.trim();

        if (imagePrompt && imagePrompt.length >= 10) {
          setProgress(60);
          const imageGenRes = await fetch('/api/generate-and-upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePrompt }),
          });

          if (imageGenRes.ok) {
            const { imageUrl } = await imageGenRes.json();
            console.log('🏞️ Generated Image URL:', imageUrl);
            localStorage.setItem('generatedImageUrl', imageUrl);
            setProgress(100);
          }
        }

        // Clean up and redirect
        localStorage.removeItem('pendingImageAnalysis');
        localStorage.removeItem('pendingAge');
        localStorage.removeItem('pendingStyle');

        // Redirect to report page
        const redirectParams = new URLSearchParams({
          age: age || '',
          style: style || '',
          returnTo: '/report',
        }).toString();
        router.push(`/report?${redirectParams}`);

      } catch (error) {
        console.error('Error in loading page:', error);
        router.push('/error?message=An error occurred during analysis. Please try again.');
      }
    };

    processImage();
  }, [router]);

  return (
      <div className="mobile-display">
    <div className={styles.container}>
      <video
        autoPlay
        playsInline
        loop
        className="w-full"
      >
        <source src="/Loading.mp4" type="video/mp4" />
      </video>
      
      <div className={styles.content}>
        <h1 className={styles.title}>Analyzing Your Colors</h1>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={styles.status}>
          {progress < 50 ? 'Analyzing your seasonal colors...' :
           progress < 80 ? 'Generating your personalized outfit...' :
           'Almost there...'}
        </p>
      </div>
    </div>
    </div>
 
  );
}