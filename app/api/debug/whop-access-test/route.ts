import { NextRequest, NextResponse } from 'next/server';
import { getExperienceContext } from '@/lib/whop-experience';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing Whop Access Level Detection...');
    
    // Get experience context
    const experienceContext = await getExperienceContext();
    console.log('🖼️ Experience context:', experienceContext);
    
    if (!experienceContext.userId || !experienceContext.experienceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId or experienceId',
        experienceContext,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test access level check
    const accessResult = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId: experienceContext.userId,
      experienceId: experienceContext.experienceId
    });
    
    console.log('✅ Whop Access Result:', accessResult);
    
    // Determine role based on access level
    const isAdmin = accessResult.accessLevel === 'admin';
    const shouldBeRole = isAdmin ? 'ADMIN' : 'USER';
    
    return NextResponse.json({
      success: true,
      experienceContext,
      whopAccessResult: accessResult,
      interpretation: {
        accessLevel: accessResult.accessLevel,
        isAdmin,
        shouldBeRole,
        explanation: {
          'admin': 'Company Owner/Moderator → ADMIN role',
          'customer': 'Community Member → USER role',
          'no_access': 'No access → USER role'
        }[accessResult.accessLevel] || 'Unknown access level'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Whop access test failed:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
  }
}
