// src/app/layout.tsx
import './globals.css';
import { Quicksand } from 'next/font/google';
import PageWrapper from '@/components/PageWrapper';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-quicksand',
});

export const metadata = {
  title: 'Colori PRO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={quicksand.variable}>
        <body className="antialiased">
          {/* Page Content */}
          <PageWrapper>{children}</PageWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
