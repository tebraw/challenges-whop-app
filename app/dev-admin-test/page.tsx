"use client";
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

export default function DevAdminTest() {
  const [authResult, setAuthResult] = useState(null);
  const [adminResult, setAdminResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testAdminAccess() {
      try {
        console.log('🧪 Testing dev admin access...');
        
        // Test dev auth
        const authResponse = await fetch('/api/auth/dev-admin');
        const authData = await authResponse.json();
        setAuthResult({ status: authResponse.status, data: authData });
        
        // Test admin challenges
        const adminResponse = await fetch('/api/admin/challenges');
        const adminData = await adminResponse.json();
        setAdminResult({ status: adminResponse.status, data: adminData });
        
      } catch (error) {
        console.error('Test error:', error);
        setAuthResult({ error: error.message });
      } finally {
        setLoading(false);
      }
    }

    testAdminAccess();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Testing admin access...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dev Admin Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Dev Auth Test</h2>
          <div className="space-y-3">
            <div className={`p-3 rounded ${authResult?.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Status: {authResult?.status || 'Error'}
            </div>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(authResult, null, 2)}
            </pre>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Admin API Test</h2>
          <div className="space-y-3">
            <div className={`p-3 rounded ${adminResult?.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Status: {adminResult?.status || 'Error'}
            </div>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(adminResult, null, 2)}
            </pre>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Test Actions</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <a 
              href="/admin" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Admin Page
            </a>
            <a 
              href="/dev-login" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Dev Login
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Test
            </button>
          </div>
        </div>
      </Card>
      
      <Card className="p-6 bg-yellow-50">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">Debug Info</h3>
        <p className="text-yellow-700 text-sm">
          This page tests local admin access without Whop headers. 
          Use this to verify the admin system works before deploying.
        </p>
      </Card>
    </div>
  );
}
