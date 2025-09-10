import Link from 'next/link';

export default function DevToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Development Tools - Role Testing
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Role Switching</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Company Owner */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-green-600 mb-2">👑 Company Owner</h3>
              <p className="text-sm text-gray-600 mb-3">
                Can access admin panel, create/edit challenges, manage settings
              </p>
              <a 
                href="/api/dev/set-admin"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                Set as Company Owner
              </a>
            </div>
            
            {/* Community Member */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-blue-600 mb-2">👥 Community Member</h3>
              <p className="text-sm text-gray-600 mb-3">
                Can only access feed/discover, participate in challenges
              </p>
              <a 
                href="/api/dev/set-member"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Set as Member
              </a>
            </div>
            
            {/* Clear Session */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-600 mb-2">🚪 Logout</h3>
              <p className="text-sm text-gray-600 mb-3">
                Clear all sessions and return to unauthenticated state
              </p>
              <a 
                href="/api/dev/clear-session"
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
              >
                Clear Session
              </a>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Pages</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin" className="text-center p-4 border rounded hover:bg-gray-50">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm">Admin Panel</div>
            </Link>
            <Link href="/discover" className="text-center p-4 border rounded hover:bg-gray-50">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">Discover</div>
            </Link>
            <Link href="/feed" className="text-center p-4 border rounded hover:bg-gray-50">
              <div className="text-2xl mb-2">📱</div>
              <div className="text-sm">Feed</div>
            </Link>
            <Link href="/subscription" className="text-center p-4 border rounded hover:bg-gray-50">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-sm">Subscription</div>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Debug Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/api/debug/role-detection"
              target="_blank"
              className="p-4 border rounded hover:bg-gray-50 text-center"
            >
              <div className="text-lg mb-1">🔍 Role Detection</div>
              <div className="text-sm text-gray-600">Analyze current authentication state</div>
            </a>
            <a 
              href="/api/debug/subscription"
              target="_blank"
              className="p-4 border rounded hover:bg-gray-50 text-center"
            >
              <div className="text-lg mb-1">💳 Subscription Debug</div>
              <div className="text-sm text-gray-600">Check subscription status</div>
            </a>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Company Owner:</strong> Can access /admin, /subscription, can create challenges</li>
            <li><strong>Community Member:</strong> Redirected from /admin to /discover, can only see feed/discover</li>
            <li><strong>Unauthenticated:</strong> Redirected to login page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
