// src/app/upload-image/selfie/page.tsx

import SelfiePageClient from './SelfiePageClient';
import TransitionWrapper from '@/components/TransitionWrapper';

export default function SelfiePage() {
  return (
    <TransitionWrapper>
      <SelfiePageClient />
    </TransitionWrapper>
  );
}