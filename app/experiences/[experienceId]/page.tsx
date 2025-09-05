import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  // The headers contains the user token
  const headersList = await headers();

  // The experienceId is a path param
  const { experienceId } = await params;

  try {
    // The user token is in the headers
    const { userId } = await whopSdk.verifyUserToken(headersList);

    const result = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    });

    const user = await whopSdk.users.getUser({ userId });
    const experience = await whopSdk.experiences.getExperience({ experienceId });

    // Either: 'admin' | 'customer' | 'no_access';
    // 'admin' means the user is an admin of the whop, such as an owner or moderator
    // 'customer' means the user is a common member in this whop
    // 'no_access' means the user does not have access to the whop
    const { accessLevel } = result;

    // If admin, redirect to our admin dashboard
    if (accessLevel === 'admin') {
      redirect('/admin?source=whop-experience&experienceId=' + experienceId);
    }

    return (
      <div className="flex justify-center items-center h-screen px-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Challenges App! 🎯
          </h1>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <p className="text-lg mb-2">
              Hi <strong>{user.name}</strong> (@{user.username})!
            </p>
            <p className="mb-2">
              You <strong>{result.hasAccess ? "have" : "do not have"} access</strong> to
              this experience.
            </p>
            <p className="mb-2">
              Access level: <strong className="text-blue-600">{accessLevel}</strong>
            </p>
            <p className="mb-2">
              Experience: <strong>{experience.name}</strong>
            </p>
            <p className="text-sm text-gray-600">
              User ID: {userId}
            </p>
          </div>
          
          {result.hasAccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ You have access to this experience!
              </p>
              {accessLevel === 'customer' && (
                <p className="text-sm text-green-600 mt-2">
                  Explore challenges and participate in the community.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                ❌ You do not have access to this experience.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Experience page error:', error);
    
    return (
      <div className="flex justify-center items-center h-screen px-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Error
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-2">
              Unable to verify your Whop authentication.
            </p>
            <p className="text-sm text-red-600 mb-4">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className="text-xs text-gray-500">
              Make sure you're accessing this through the Whop app iframe.
            </p>
            
            {/* Debug info */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Experience ID: {experienceId}</p>
              <p>Headers available: {Array.from(headersList.keys()).join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
