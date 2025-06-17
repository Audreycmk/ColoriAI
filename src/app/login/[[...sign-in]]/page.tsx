'use client';

import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import styles from '@/styles/auth.module.css';

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) return;

      if (isSignedIn) {
        router.push('/');
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="mobile-display">
      {/* Background Video */}
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src="/login.mp4" type="video/mp4" />
      </video>

      {/* Back Button */}
      <div className={styles.backButton} onClick={() => router.push('/')}>
        &lt;
      </div>

      <div style={{
          position: 'absolute',
          top: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto',
          height: 'auto'
        }}>
          <Image
            src="/ColoriAI.png"
            alt="ColoriAI Logo"
            width={200}
            height={50}
            style={{ objectFit: 'contain' }}
          />
        </div>
      {/* Styled Container */}
      <div 
        style={{
          position: 'absolute',
          top: '172px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '375px',
          height: '500px',
          borderRadius: '10px',
          borderTop: '2px solid rgba(21, 19, 19, 0.04)',
          borderRight: '2px solid rgba(21, 19, 19, 0.04)',
          background: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0px -5px 17px 0px rgba(21, 21, 21, 0.20)',
          backdropFilter: 'blur(30px)',
          zIndex: 1
        }}
      >
        
      </div>

      <div className="flex flex-col items-center justify-center p-4 relative z-10"  style={{ marginTop: '200px' }}>
        <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">Login</h1>
            <p className="text-white/90 font-semibold">Welcom back to ColoriAI</p>
          </div>
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-white-900 hover:bg-gray-800 font-semibold',
                footerActionLink: 'text-white-900 hover:text-gray-800 font-semibold',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50 font-semibold',
                formFieldInput: 'bg-white border border-gray-300',
                formFieldLabel: 'text-gray-700 font-semibold',
                footerAction: 'text-gray-600 font-semibold',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
} 