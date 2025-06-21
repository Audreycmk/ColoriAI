// src/app/page.tsx 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import TransitionWrapper from '@/components/TransitionWrapper';
import Navigation from '@/components/Navigation';
import '@/styles/style.css';

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) return;

      if (isSignedIn) {
        try {
          const response = await fetch('/api/check-admin');
          const data = await response.json();
          if (data.isAdmin) {
            sessionStorage.setItem('skipAdminRedirect', 'true');
            setIsAdmin(true);
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn]);

  const handleMainButtonClick = () => {
    if (!isSignedIn) {
      router.push('/please-login');
    } else if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/age');
    }
  };

  return (
    <TransitionWrapper>
      <div className="mobile-display">
        {/* Background Video */}
        <video className="bg-video" autoPlay loop muted playsInline>
          <source src="/home.mp4" type="video/mp4" />
        </video>

        {/* Navigation */}
        <Navigation />

        {/* Main Button */}
        <div className="container">
          <button className="find-my-color" onClick={handleMainButtonClick}>
            {isAdmin ? 'Dashboard' : 'Find My Color'}
          </button>
        </div>

        {/* Login Required Popup */}
        {showLoginPopup && (
          <div className="popup">
            <div className="popup-content">
              <p>Please log in to continue</p>
              <Link href="/login">
                <button className="login">Login</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </TransitionWrapper>
  );
}
