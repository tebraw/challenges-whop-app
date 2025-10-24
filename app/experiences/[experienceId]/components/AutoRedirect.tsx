'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoRedirectProps {
  to: string;
  delay?: number;
}

export default function AutoRedirect({ to, delay = 0 }: AutoRedirectProps) {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔄 Auto-redirecting to:', to);
      router.push(to);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [to, delay, router]);
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-300">Loading challenges...</p>
      </div>
    </div>
  );
}
