'use client';

import { SignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import styles from '@/styles/auth.module.css';

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="mobile-display">
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

      <div style={{
        position: 'absolute',
        top: '170px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '375px',
        height: '700px',
        borderRadius: '10px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(30px)',
        zIndex: 1
      }}>
        <div className="flex flex-col items-center justify-center p-3 relative z-10" style={{ marginTop: '10px' }}>
          <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl p-6">
            <div className="text-center" style={{ marginBottom: '-20px', border:'none'}}>
              <h1 className="text-3xl font-semibold text-white">Create Account</h1>
            </div>
            <div style={{ marginTop: '-30px', gap:'0'}}>
              <SignUp
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-white-900 hover:bg-gray-800 font-semibold',
                    footerActionLink: 'text-white-900 hover:text-gray-800 font-semibold',
                    card: 'bg-transparent shadow-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-500 font-semibold',
                    formFieldInput: 'bg-white',
                    formFieldLabel: 'text-gray-700 font-semibold',
                    footerAction: 'text-gray-600 font-semibold',
                    socialButtonsBlockButtonArrow: 'hidden',
                    socialButtonsBlockButtonText: 'text-gray-700',
                    dividerLine: 'hidden',
                    dividerText: 'hidden',
                    formField: 'shadow-none border-none',
                    formFieldAction: 'shadow-none border-none',
                    formFieldInputWrapper: 'shadow-none border-none',
                    formFieldLabelRow: 'shadow-none border-none',
                    formFieldRow: 'shadow-none border-none',
                    formFieldInputShowPasswordButton: 'shadow-none border-none',
                    formFieldInputShowPasswordIcon: 'shadow-none border-none',
                    formFieldInputShowPasswordIconContainer: 'shadow-none border-none',
                    formFieldInputShowPasswordIconWrapper: 'shadow-none border-none',
                    formFieldInputShowPasswordIconWrapperContainer: 'shadow-none border-none',
                    formFieldInputShowPasswordIconWrapperContainerWrapper: 'shadow-none border-none',
                  },
                }}
                afterSignUpUrl="/"
                redirectUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 