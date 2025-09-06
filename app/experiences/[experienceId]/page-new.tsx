import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import AdminDashboard from './components/AdminDashboard';
import CustomerChallenges from './components/CustomerChallenges';
import WhopLoginButton from '@/components/WhopLoginButton';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const headersList = await headers();
  const { experienceId } = await params;

  try {
    const { userId } = await whopSdk.verifyUserToken(headersList);

    const result = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    });

    const user = await whopSdk.users.getUser({ userId });
    const experience = await whopSdk.experiences.getExperience({ experienceId });

    const { accessLevel } = result;

    // Sync with our database
    let dbUser = await prisma.user.findUnique({
      where: { whopUserId: userId }
    });

    if (!dbUser && result.hasAccess) {
      // Create tenant first
      let tenant = await prisma.tenant.findFirst({
        where: { whopCompanyId: experience.company.id }
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: `Company ${experience.company.id}`,
            whopCompanyId: experience.company.id
          }
        });
      }

      dbUser = await prisma.user.create({
        data: {
          whopUserId: userId,
          email: user.username + '@whop.local', // Fallback email
          name: user.name || user.username,
          role: accessLevel === 'admin' ? 'ADMIN' : 'USER',
          whopCompanyId: experience.company.id,
          tenantId: tenant.id
        }
      });
    }

    // No access - show login prompt
    if (accessLevel === 'no_access' || !result.hasAccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                🏆
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Challenge Platform
              </h1>
              <p className="text-gray-600">
                Tritt spannenden Challenges bei und gewinne tolle Preise!
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                ⚠️ Du benötigst Zugang zu dieser Experience über Whop
              </p>
            </div>

            <WhopLoginButton />
            
            <div className="mt-6 text-sm text-gray-500">
              Experience: {experience.name}
            </div>
          </div>
        </div>
      );
    }

    // Admin access - show dashboard
    if (accessLevel === 'admin') {
      return (
        <AdminDashboard 
          experienceId={experienceId}
          user={dbUser!}
          whopUser={user}
        />
      );
    }

    // Customer access - show challenges
    if (accessLevel === 'customer') {
      return (
        <CustomerChallenges 
          experienceId={experienceId}
          user={dbUser!}
          whopUser={user}
        />
      );
    }

    // Fallback
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Unbekannter Zugangstyp: {accessLevel}
          </h1>
          <p className="text-gray-600">
            Bitte kontaktiere den Support
          </p>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Experience page error:', error);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              ❌
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600">
              Fehler beim Verifizieren deiner Whop-Authentifizierung
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm mb-2">
              {error instanceof Error ? error.message : 'Unbekannter Fehler'}
            </p>
            <p className="text-xs text-red-600">
              Stelle sicher, dass du auf diese App über das Whop-Interface zugreifst.
            </p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Erneut versuchen
          </button>

          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Experience ID:</strong> {experienceId}</p>
              <p><strong>Headers:</strong> {Array.from(headersList.keys()).join(', ')}</p>
              <p><strong>Error:</strong> {error instanceof Error ? error.stack : String(error)}</p>
            </div>
          </details>
        </div>
      </div>
    );
  }
}
