'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CompanyDashboard() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const companyId = params?.companyId as string;
    console.log('📍 Dashboard route accessed for company:', companyId);
    
    // Immediate redirect to admin panel where users create challenges
    router.replace('/admin');
  }, [params, router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <h2 className="text-xl font-semibold text-gray-800">
          Weiterleitung zum Challenge Dashboard...
        </h2>
        <p className="text-gray-600">
          Company: {params?.companyId || 'Loading...'}
        </p>
        <p className="text-sm text-gray-500">
          Du wirst automatisch zu deinem Admin-Panel weitergeleitet
        </p>
      </div>
    </div>
  );
}