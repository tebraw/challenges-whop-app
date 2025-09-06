// app/admin-direct/page.tsx
// This page is disabled - redirecting to main admin page

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main admin page
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to main admin dashboard...</p>
      </div>
    </div>
  );
}
