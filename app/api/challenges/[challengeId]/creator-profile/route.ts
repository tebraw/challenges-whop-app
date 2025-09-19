import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk-unified';
import { prisma } from '@/lib/prisma';
import { getOptimizedWhopUrlString } from '@/lib/whop-url-optimizer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    
    console.log('🔍 Challenge Creator Profile API:', { challengeId });
    
    // Get challenge and tenant info
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            whopCompanyId: true
          }
        }
      }
    });

    if (!challenge || !challenge.tenant?.whopCompanyId) {
      return NextResponse.json(
        { 
          error: 'Challenge or company not found',
          fallbackUrl: 'https://whop.com'
        },
        { status: 404 }
      );
    }

    console.log('📊 Challenge Creator Info:', {
      challengeId,
      tenantName: challenge.tenant.name,
      whopCompanyId: challenge.tenant.whopCompanyId
    });

    try {
      // Load Challenge Creator's company details via Whop API
      console.log('🚀 Loading Challenge Creator company details via Whop SDK...');
      
      const companyDetails = await whopSdk.companies.getCompany({
        companyId: challenge.tenant.whopCompanyId
      });
      
      console.log('✅ Company Details Loaded:', {
        companyId: companyDetails.id,
        route: companyDetails.route || 'No route',
        title: companyDetails.title
      });

      // Extract route (handle) from company details
      const handle = companyDetails.route;

      console.log('🎯 Challenge Creator Profile Data:', {
        handle,
        title: companyDetails.title
      });

      // Generate optimal URL
      let creatorProfileUrl: string;
      let urlType: string;

      if (handle) {
        // Use company route (handle) for clean URL
        creatorProfileUrl = `https://whop.com/${handle}`;
        urlType = 'handle';
        console.log('� Generated Handle URL:', creatorProfileUrl);
      } else {
        // Fallback: Use existing optimization system
        creatorProfileUrl = getOptimizedWhopUrlString(challenge.tenant);
        urlType = 'fallback';
        console.log('⚠️ Using Fallback URL:', creatorProfileUrl);
      }

      return NextResponse.json({
        success: true,
        creatorProfileUrl,
        urlType,
        creatorInfo: {
          name: challenge.tenant.name,
          handle: handle || null,
          title: companyDetails.title,
          companyId: companyDetails.id
        }
      });

    } catch (whopError) {
      console.error('❌ Whop API Error:', whopError);
      
      // Fallback to existing URL optimization system
      const fallbackUrl = getOptimizedWhopUrlString(challenge.tenant);
      
      console.log('🔄 Using Existing URL Optimization System:', fallbackUrl);
      
      return NextResponse.json({
        success: true,
        creatorProfileUrl: fallbackUrl,
        urlType: 'fallback',
        creatorInfo: {
          name: challenge.tenant.name,
          handle: null,
          title: null,
          companyId: null
        },
        warning: 'Used fallback URL due to API limitations'
      });
    }

  } catch (error) {
    console.error('❌ Challenge Creator Profile API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get creator profile',
        fallbackUrl: 'https://whop.com'
      },
      { status: 500 }
    );
  }
}