'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import styles from './PleaseLoginPage.module.css'

export default function PleaseLoginPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // If already signed in, go back to test page
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/age'); // or wherever test starts
    }
  }, [isSignedIn, router]);

  return (
    <div className="mobile-display">
      <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
        <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
      </div>
      
      <div className="p-4 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[620px] overflow-y-auto flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full -mt-[100px]">
          <h1 className={styles.seasonalColorReport}>Please log in to continue</h1>
          
          <Link href="/login" className="w-full max-w-[200px] mt-8">
            <button 
              className="w-full rounded-[33px] bg-[rgba(224,175,123,0.70)] p-[10px] mt-[40px] text-white font-['Poiret_One'] text-[13px] items-center justify-center cursor-pointer"
            >
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
