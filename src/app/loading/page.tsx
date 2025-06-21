'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import styles from './LoadingPage.module.css';

export default function LoadingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [progress, setProgress] = useState(0);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const processImage = async () => {
      try {
        // Mark as processed to prevent duplicate executions
        hasProcessed.current = true;

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
        console.log('📝 Report saved to localStorage');

        // Step 2: DALL-E Image Generation (50-100%)
        let generatedImageUrl = '';
        
        // Extract image prompt and generate outfit image
        const match = cleanedResult.match(/\*\*Image Prompt:\*\*\s*(.+)/);
        const imagePrompt = match?.[1]?.trim();

        if (imagePrompt && imagePrompt.length >= 10) {
          setProgress(60);
          console.log('🎨 Generating image with prompt:', imagePrompt);
          
          try {
            const imageGenRes = await fetch('/api/generate-and-upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imagePrompt }),
            });

            if (imageGenRes.ok) {
              const imageData = await imageGenRes.json();
              if (imageData.imageUrl) {
                generatedImageUrl = imageData.imageUrl;
                console.log('🏞️ Generated Image URL:', imageData.imageUrl);
                localStorage.setItem('generatedImageUrl', imageData.imageUrl);
                localStorage.setItem('generatedOutfitImage', imageData.imageUrl);
                console.log('🖼️ Image URL saved to localStorage');
                setProgress(100);
              } else {
                console.error('❌ No image URL in response:', imageData);
                generatedImageUrl = '/outfit-demo.png'; // Fallback image
              }
            } else {
              console.error('❌ Image generation failed:', imageGenRes.status);
              generatedImageUrl = '/outfit-demo.png'; // Fallback image
            }
          } catch (error) {
            console.error('❌ Error generating image:', error);
            generatedImageUrl = '/outfit-demo.png'; // Fallback image
          }
        } else {
          console.warn('⚠️ No valid image prompt found');
          generatedImageUrl = '/outfit-demo.png'; // Fallback image
        }

        // Step 3: Save to Database (if user is signed in)
        if (user?.id) {
          try {
            // Parse the cleaned result to extract structured data
            const parsedData = parseReportData(cleanedResult);
            
            const saveRes = await fetch('/api/save-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                result: parsedData,
                outfitImage: generatedImageUrl || '/outfit-demo.png'
              }),
            });

            if (saveRes.ok) {
              const savedReport = await saveRes.json();
              console.log('💾 Report saved to database:', savedReport._id);
            } else {
              console.error('❌ Failed to save report to database');
            }
          } catch (error) {
            console.error('❌ Error saving to database:', error);
          }
        } else {
          console.log('⚠️ User not signed in, skipping database save');
        }

        // Clean up and redirect
        localStorage.removeItem('pendingImageAnalysis');
        localStorage.removeItem('pendingAge');
        localStorage.removeItem('pendingStyle');
        console.log('🧹 Cleaned up temporary data from localStorage');

        // Redirect to report page
        const redirectParams = new URLSearchParams({
          age: age || '',
          style: style || '',
          returnTo: '/report',
        }).toString();
        console.log('🔄 Redirecting to report page...');
        router.push(`/report?${redirectParams}`);

      } catch (error) {
        console.error('❌ Error in loading page:', error);
        router.push('/error?message=An error occurred during analysis. Please try again.');
      }
    };

    processImage();
  }, [router, user?.id]); // Only depend on user.id instead of the entire user object

  // Helper function to parse report data into structured format
  const parseReportData = (reportText: string) => {
    const data = {
      seasonType: '',
      colorExtraction: [] as { label: string; hex: string }[],
      colorPalette: [] as { name: string; hex: string }[]
    };

    // Split by sections
    const sections = reportText.split('\n\n').map(section => section.trim());

    for (const section of sections) {
      const lines = section.split('\n').map(line => line.trim());
      
      // Seasonal Color Type
      if (lines[0].includes('Seasonal Color Type:')) {
        const type = lines[0].split(':')[1].trim();
        data.seasonType = type.replace(/\*\*/g, '').trim();
      }
      
      // Color Extraction
      else if (lines[0].includes('Color Extraction')) {
        for (let i = 2; i < lines.length; i++) {
          if (lines[i].includes(',')) {
            const [label, hex] = lines[i].split(',');
            data.colorExtraction.push({ label: label.trim(), hex: hex.trim() });
          }
        }
      }
      
      // Color Palette
      else if (lines[0].includes('9-Color Seasonal Palette')) {
        for (let i = 2; i < lines.length; i++) {
          if (lines[i].includes(',')) {
            const [name, hex] = lines[i].split(',');
            data.colorPalette.push({ name: name.trim(), hex: hex.trim() });
          }
        }
      }
    }

    return data;
  };

  return (
    <div className="mobile-display">
      <div className={styles.container}>
        <video
          autoPlay
          playsInline
          loop
          muted
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