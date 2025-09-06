import { whopSdk } from "@/lib/whop-sdk";
import { headers, cookies } from "next/headers";
import Link from "next/link";

export default async function WhopAccessPage() {
  const headersList = await headers();
  const cookieStore = await cookies();
  
  let debugInfo: any = {
    hasUserToken: false,
    userId: null,
    experienceId: null,
    companyId: null,
    accessLevels: {},
    errors: []
  };

  try {
    // Check for Whop user token
    const whopUserToken = headersList.get('x-whop-user-token') || cookieStore.get('whop_user_token')?.value;
    debugInfo.hasUserToken = !!whopUserToken;
    
    if (whopUserToken) {
      // Get user ID
      const { userId } = await whopSdk.verifyUserToken(headersList);
      debugInfo.userId = userId;
      
      // Check for experience ID
      const experienceId = headersList.get('x-whop-experience-id') || 
                           headersList.get('X-Whop-Experience-Id') || 
                           headersList.get('x-experience-id');
      debugInfo.experienceId = experienceId;
      
      // Get company ID from app config
      const appConfigCookie = cookieStore.get('whop.app-config')?.value;
      if (appConfigCookie) {
        try {
          const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
          debugInfo.companyId = appConfig.did;
        } catch (error) {
          debugInfo.errors.push('Failed to parse app config');
        }
      }
      
      // Test experience access if we have experience ID
      if (experienceId && userId) {
        try {
          const experienceAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
            userId,
            experienceId
          });
          debugInfo.accessLevels.experience = experienceAccess;
        } catch (error: any) {
          debugInfo.errors.push(`Experience access error: ${error.message}`);
        }
      }
      
      // Test company access if we have company ID
      if (debugInfo.companyId && userId) {
        try {
          const companyAccess = await whopSdk.access.checkIfUserHasAccessToCompany({
            userId,
            companyId: debugInfo.companyId
          });
          debugInfo.accessLevels.company = companyAccess;
        } catch (error: any) {
          debugInfo.errors.push(`Company access error: ${error.message}`);
        }
      }
    }
    
  } catch (error: any) {
    debugInfo.errors.push(`Main error: ${error.message}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎯 Challenges App - Access Debug
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* User Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">User Info</h2>
              <p><strong>Has User Token:</strong> {debugInfo.hasUserToken ? '✅ Yes' : '❌ No'}</p>
              <p><strong>User ID:</strong> {debugInfo.userId || 'None'}</p>
            </div>
            
            {/* Context Info */}
            <div className="bg-green-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Context Info</h2>
              <p><strong>Experience ID:</strong> {debugInfo.experienceId || 'None'}</p>
              <p><strong>Company ID:</strong> {debugInfo.companyId || 'None'}</p>
            </div>
          </div>
          
          {/* Access Levels */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Access Levels</h2>
            
            {debugInfo.accessLevels.experience && (
              <div className="mb-2">
                <strong>Experience Access:</strong> {debugInfo.accessLevels.experience.accessLevel}
                {debugInfo.accessLevels.experience.hasAccess ? ' ✅' : ' ❌'}
              </div>
            )}
            
            {debugInfo.accessLevels.company && (
              <div className="mb-2">
                <strong>Company Access:</strong> {debugInfo.accessLevels.company.accessLevel}
                {debugInfo.accessLevels.company.hasAccess ? ' ✅' : ' ❌'}
              </div>
            )}
            
            {!debugInfo.accessLevels.experience && !debugInfo.accessLevels.company && (
              <p className="text-yellow-700">No access levels tested</p>
            )}
          </div>
          
          {/* Recommendations */}
          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">Recommendations</h2>
            
            {debugInfo.accessLevels.company?.accessLevel === 'admin' && (
              <div className="mb-2">
                <p className="text-indigo-700 mb-2">🎯 <strong>You are a Company Owner!</strong></p>
                <Link 
                  href={`/dashboard/${debugInfo.companyId}`}
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Go to Dashboard →
                </Link>
              </div>
            )}
            
            {debugInfo.accessLevels.experience?.accessLevel === 'customer' && (
              <div className="mb-2">
                <p className="text-indigo-700 mb-2">👤 <strong>You are a Community Member!</strong></p>
                <Link 
                  href={`/experiences/${debugInfo.experienceId}`}
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Go to Experience →
                </Link>
              </div>
            )}
            
            {debugInfo.accessLevels.experience?.accessLevel === 'no_access' && (
              <p className="text-red-700">❌ You don't have access to this experience</p>
            )}
            
            {!debugInfo.hasUserToken && (
              <p className="text-red-700">❌ No Whop user token found - please access through Whop platform</p>
            )}
          </div>
          
          {/* Errors */}
          {debugInfo.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Errors</h2>
              {debugInfo.errors.map((error: string, index: number) => (
                <p key={index} className="text-red-700">• {error}</p>
              ))}
            </div>
          )}
          
          {/* Debug Data */}
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">🔍 Raw Debug Data</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
