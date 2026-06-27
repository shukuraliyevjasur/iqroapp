'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function OnboardingGate() {
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem('iqro_onboarded')) {
      router.replace('/onboarding');
    }
  }, [router]);
  return null;
}
