// Test-Seite für Admin-Authentifizierung
'use client';

import { useState, useEffect } from 'react';

export default function AuthTestPage() {
  const [adminTest, setAdminTest] = useState<any>(null);
  const [normalTest, setNormalTest] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // Setze Test-User über URL Parameter
    const params = new URLSearchParams(window.location.search);
    const as = params.get('as');
    if (as) {
      document.cookie = `as=${as}`;
      setCurrentUser(as);
    }
  }, []);

  const testAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-admin');
      const data = await response.json();
      setAdminTest(data);
    } catch (error) {
      setAdminTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const switchUser = (userId: string) => {
    document.cookie = `as=${userId}`;
    setCurrentUser(userId);
    window.location.href = `?as=${userId}`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔐 Admin-Authentifizierung Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Switch */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Aktueller Benutzer</h2>
          <p className="mb-4">
            <strong>Eingeloggt als:</strong> {currentUser || 'Nicht eingeloggt'}
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => switchUser('admin-user')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🔑 Als Admin einloggen
            </button>
            <button
              onClick={() => switchUser('normal-user')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              👤 Als normaler User einloggen
            </button>
          </div>
        </div>

        {/* Admin Test */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Admin-Test</h2>
          <button
            onClick={testAdminAccess}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
          >
            🧪 Admin-Zugang testen
          </button>
          
          {adminTest && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Ergebnis:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(adminTest, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🔍 Erwartete Ergebnisse</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold text-green-800">admin-user</h3>
            <p className="text-green-700">
              ✅ isAdmin: true<br/>
              ✅ Kann Admin-Seiten besuchen<br/>
              ✅ Hat Zugang zu /admin/*
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <h3 className="font-semibold text-red-800">normal-user</h3>
            <p className="text-red-700">
              ❌ isAdmin: false<br/>
              ❌ Wird von Admin-Seiten umgeleitet<br/>
              ❌ Kein Zugang zu /admin/*
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🔗 Test-Navigation</h2>
        <div className="grid grid-cols-2 gap-4">
          <a 
            href="/admin" 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center block"
          >
            📊 Admin Dashboard
          </a>
          <a 
            href="/challenges" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center block"
          >
            🎯 Challenges (User)
          </a>
        </div>
      </div>
    </div>
  );
}
