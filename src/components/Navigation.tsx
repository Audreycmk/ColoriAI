'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/check-admin');
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };

    if (isSignedIn) {
      checkAdmin();
    }
  }, [isSignedIn]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 10,
      }}
    >
      {isLoaded && (
        isSignedIn ? (
          <div className="flex items-center gap-3">
            {/* "My Reports" Button - Only show for non-admin users */}
            {!isAdmin && (
              <Link href="/report-history">
                <button className="text-sm hover:text-orange-500 mt-2" style={{
                  color: '#FFF',
                  textAlign: 'center',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '2px 1px 1px rgba(0, 0, 0, 0.5)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  background: 'none',
                  border: 'none',
                  padding: '10px',
                  cursor: 'pointer'
                }}>
                  My Reports
                </button>
              </Link>
            )}

            {/* Clerk User Avatar */}
            <div className="w-15 h-15 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all mt-2">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonAvatarImage: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <Link href="/login">
            <button className="login">LOGIN</button>
          </Link>
        )
      )}
    </div>
  );
}
