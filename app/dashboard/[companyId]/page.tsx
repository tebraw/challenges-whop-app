import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  // The headers contains the user token
  const headersList = await headers();

  // The companyId is a path param
  const { companyId } = await params;

  try {
    // The user token is in the headers
    const { userId } = await whopSdk.verifyUserToken(headersList);

    // Check if user has access to this company as admin
    const result = await whopSdk.access.checkIfUserHasAccessToCompany({
      userId,
      companyId,
    });

    const user = await whopSdk.users.getUser({ userId });

    // Only admins can access dashboard views
    if (result.accessLevel !== 'admin') {
      return (
        <div className="flex justify-center items-center h-screen px-8">
          <div className="max-w-2xl text-center">
            <h1 className="text-3xl font-bold mb-4 text-red-600">
              🚫 Access Denied
            </h1>
            <p className="text-lg mb-4">
              You need Company Owner/Admin privileges to access this dashboard.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Your access level: <strong>{result.accessLevel}</strong>
            </p>
            <Link 
              href="/discover"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              ← Back to Discover
            </Link>
          </div>
        </div>
      );
    }

    // Admin has access - redirect to admin interface
    return (
      <div className="flex justify-center items-center h-screen px-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">
            🎯 Challenges App - Creator Dashboard
          </h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-lg mb-2">
              Welcome <strong>{user.name}</strong> (@{user.username})! 
            </p>
            <p className="text-green-800 mb-4">
              ⭐ You have <strong>Admin Access</strong> as the company owner.
            </p>
            <p className="text-sm text-green-600 mb-4">
              Company ID: <strong>{companyId}</strong>
            </p>
          </div>
          
          <Link 
            href={`/admin?source=dashboard&companyId=${companyId}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            🚀 Open Admin Interface
          </Link>
          
          <p className="text-xs text-gray-500 mt-4">
            Create and manage challenges for your business
          </p>
        </div>
      </div>
    );

  } catch (error: any) {
    console.error('Dashboard access error:', error);
    
    return (
      <div className="flex justify-center items-center h-screen px-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">
            ❌ Authentication Error
          </h1>
          <p className="text-lg mb-4">
            Unable to verify your access to this dashboard.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Error: {error.message}
          </p>
          <Link 
            href="/discover"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }
}
