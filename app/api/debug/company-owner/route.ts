import { NextRequest, NextResponse } from 'next/server';
import { getExperienceContext } from '@/lib/whop-experience';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Starting Company Owner detection debug...');
    
    // Get all headers for debugging
    const headers = Object.fromEntries(req.headers.entries());
    
    // Get experience context
    const experienceContext = await getExperienceContext();
    console.log('🖼️ Experience context:', experienceContext);
    
    // Check for company ownership detection
    let ownershipCheck = null;
    if (experienceContext.userId && experienceContext.companyId) {
      try {
        console.log('🔍 Checking company ownership for:', {
          userId: experienceContext.userId,
          companyId: experienceContext.companyId
        });
        
        const userCompaniesResponse = await fetch(`https://api.whop.com/v5/users/${experienceContext.userId}/companies`, {
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userCompaniesResponse.ok) {
          const userCompanies = await userCompaniesResponse.json();
          console.log('👥 User companies response:', userCompanies);
          
          const isOwner = userCompanies.data?.some((company: any) => company.id === experienceContext.companyId);
          
          ownershipCheck = {
            success: true,
            isOwner,
            userCompanies: userCompanies.data,
            targetCompanyId: experienceContext.companyId,
            apiResponse: userCompanies
          };
        } else {
          ownershipCheck = {
            success: false,
            error: `API responded with ${userCompaniesResponse.status}`,
            statusText: userCompaniesResponse.statusText
          };
        }
      } catch (error: any) {
        ownershipCheck = {
          success: false,
          error: error.message
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      experienceContext,
      ownershipCheck,
      headers: {
        'x-whop-app-id': headers['x-whop-app-id'],
        'x-whop-user-token': headers['x-whop-user-token'],
        'referer': headers['referer']
      },
      environment: {
        hasWhopApiKey: !!process.env.WHOP_API_KEY,
        whopApiKeyPrefix: process.env.WHOP_API_KEY?.substring(0, 10) + '...'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
