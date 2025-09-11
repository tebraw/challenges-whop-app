import { redirect } from 'next/navigation';

// Simple dev tools redirect page
export default function DevToolsPage() {
  // Redirect to admin in production, show dev tools in development
  if (process.env.NODE_ENV === 'production') {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Development Tools</h1>
          
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/admin" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Admin Dashboard</h3>
                <p className="text-sm text-gray-600">Manage challenges and users</p>
              </a>
              
              <a href="/dev-login" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Dev Login</h3>
                <p className="text-sm text-gray-600">Development authentication</p>
              </a>
              
              <a href="/discover" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Discover</h3>
                <p className="text-sm text-gray-600">Browse public challenges</p>
              </a>
              
              <a href="/api/debug/user" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">Debug User</h3>
                <p className="text-sm text-gray-600">Check current user status</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
