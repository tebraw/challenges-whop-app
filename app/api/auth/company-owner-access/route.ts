// API Route: Company Owner Direct Access
// For users who access admin directly as company owners without experience context

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { autoCreateOrUpdateUser } from '@/lib/auto-company-extraction';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  console.log('🏢 Company Owner Access API called');
  
  try {
    const headersList = await headers();
    const whopUserId = headersList.get('x-whop-user-id') || headersList.get('x-user-id');
    const headerCompanyId = headersList.get('x-whop-company-id');
    const experienceId = headersList.get('x-whop-experience-id');
    
    console.log('📊 Company Owner Headers:', {
      whopUserId: whopUserId || 'NONE',
      headerCompanyId: headerCompanyId || 'NONE',
      experienceId: experienceId || 'NONE'
    });
    
    if (!whopUserId) {
      return NextResponse.json({
        success: false,
        error: 'No user ID found',
        debug: 'x-whop-user-id header missing'
      }, { status: 401 });
    }
    
    // Case 1: Company Owner without Experience (direct admin access)
    if (!experienceId && headerCompanyId) {
      console.log('🏢 Processing Company Owner direct access');
      
      try {
        // Verify company ownership using Whop SDK
        const company = await whopSdk.companies.getCompany({
          companyId: headerCompanyId
        });
        
        if (!company) {
          return NextResponse.json({
            success: false,
            error: 'Company not found',
            debug: `Company ${headerCompanyId} not found`
          }, { status: 404 });
        }
        
        // Get authorized users to check if user is owner
        const authorizedUsers = await whopSdk.companies.getCompanyAuthorizedUsers({
          companyId: headerCompanyId
        });
        
        const userAccess = authorizedUsers?.authorizedUsers?.find(
          (user: any) => user.userId === whopUserId
        );
        
        if (!userAccess || userAccess.role !== 'owner') {
          return NextResponse.json({
            success: false,
            error: 'Not a company owner',
            debug: `User ${whopUserId} is not owner of company ${headerCompanyId}`,
            userRole: userAccess?.role || 'none'
          }, { status: 403 });
        }
        
        // Create/update user as Company Owner
        const user = await autoCreateOrUpdateUser(whopUserId, null, headerCompanyId);
        
        return NextResponse.json({
          success: true,
          userType: 'Company Owner',
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.whopCompanyId,
            tenantId: user.tenantId
          },
          accessContext: {
            type: 'company_owner',
            companyId: headerCompanyId,
            experienceId: null
          }
        });
        
      } catch (error) {
        console.error('❌ Company owner verification failed:', error);
        return NextResponse.json({
          success: false,
          error: 'Company verification failed',
          debug: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Case 2: Experience Member with Experience context
    if (experienceId) {
      console.log('🎯 Processing Experience Member access');
      
      try {
        const user = await autoCreateOrUpdateUser(whopUserId, experienceId, headerCompanyId);
        
        return NextResponse.json({
          success: true,
          userType: user.role === 'ADMIN' ? 'Experience Admin' : 'Experience Member',
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.whopCompanyId,
            tenantId: user.tenantId
          },
          accessContext: {
            type: 'experience_member',
            companyId: user.whopCompanyId,
            experienceId: experienceId
          }
        });
        
      } catch (error) {
        console.error('❌ Experience member processing failed:', error);
        return NextResponse.json({
          success: false,
          error: 'Experience access failed',
          debug: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Case 3: Invalid context
    return NextResponse.json({
      success: false,
      error: 'Invalid access context',
      debug: 'Neither company owner nor experience member context found',
      context: {
        hasUserId: !!whopUserId,
        hasCompanyId: !!headerCompanyId,
        hasExperienceId: !!experienceId
      }
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Company Owner Access API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
