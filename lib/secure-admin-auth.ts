// Create secure admin verification function
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whopSdk } from '@/lib/whop-sdk';

interface SecureAdminAuth {
  userId: string;
  whopUserId: string;
  tenantId: string;
  whopCompanyId: string;
  email: string;
}

/**
 * Secure admin verification with strict tenant isolation
 * NO FALLBACKS - Requires valid Whop authentication
 */
export async function verifySecureAdminAccess(request: NextRequest): Promise<SecureAdminAuth> {
  try {
    // Extract headers for Whop SDK
    const headersList = new Headers();
    request.headers.forEach((value, key) => {
      headersList.set(key, value);
    });

    // Verify Whop token - NO FALLBACK!
    const auth = await whopSdk.verifyUserToken(headersList);
    
    if (!auth || !auth.userId) {
      throw new Error('Invalid Whop authentication token');
    }

    // Get user from database with strict validation
    const user = await prisma.user.findUnique({
      where: { whopUserId: auth.userId },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error(`User not found for Whop ID: ${auth.userId}`);
    }

    if (user.role !== 'ADMIN') {
      throw new Error(`User ${user.email} does not have admin privileges`);
    }

    if (!user.whopCompanyId) {
      throw new Error(`User ${user.email} has no Whop company association`);
    }

    if (!user.tenant.whopCompanyId) {
      throw new Error(`Tenant ${user.tenant.name} has no Whop company association`);
    }

    if (user.whopCompanyId !== user.tenant.whopCompanyId) {
      throw new Error(
        `SECURITY VIOLATION: User company (${user.whopCompanyId}) ` +
        `does not match tenant company (${user.tenant.whopCompanyId})`
      );
    }

    console.log('✅ Secure admin verified:', {
      email: user.email,
      tenantId: user.tenantId,
      companyId: user.whopCompanyId
    });

    return {
      userId: user.id,
      whopUserId: auth.userId,
      tenantId: user.tenantId,
      whopCompanyId: user.whopCompanyId,
      email: user.email
    };

  } catch (error: any) {
    console.error('🚨 Admin verification failed:', error.message);
    throw new Error(`Admin access denied: ${error.message}`);
  }
}
