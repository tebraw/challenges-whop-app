// app/page.tsx - Experience App Entry Point with Role-Based Access
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { whopSdk } from "@/lib/whop-sdk";

// Force dynamic rendering for real-time Whop context
export const dynamic = 'force-dynamic';

export default async function Home() {
  console.log('🚀 Experience App - Role-Based Entry Point');
  
  try {
    const headersList = await headers();
    
    // Extract Whop context
    const whopUserToken = headersList.get('x-whop-user-token');
    const experienceId = headersList.get('x-whop-experience-id') || 
                         headersList.get('x-experience-id') ||
                         headersList.get('X-Whop-Experience-Id');
    
    // Extract company ID (critical for multi-tenancy)
    let companyId = headersList.get('x-whop-company-id') || 
                    headersList.get('x-company-id');
    
    // Fallback: Try app config cookie
    if (!companyId) {
      const cookieStore = await cookies();
      const appConfigCookie = cookieStore.get('whop.app-config')?.value;
      if (appConfigCookie) {
        try {
          const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
          companyId = appConfig.did;
        } catch (error) {
          console.log('❌ Failed to parse app config for companyId');
        }
      }
    }
    
    console.log('🔍 Whop Context:', {
      hasToken: !!whopUserToken,
      experienceId,
      companyId,
      isWhopRequest: !!whopUserToken || !!experienceId
    });
    
    // Must have either token OR be in Whop environment
    if (whopUserToken || experienceId || companyId) {
      console.log('✅ Valid Whop Context - Processing user role');
      
      try {
        let userId = null;
        
        // Try to verify user token
        if (whopUserToken) {
          try {
            const tokenResult = await whopSdk.verifyUserToken(headersList);
            userId = tokenResult.userId;
            console.log('👤 Verified User ID:', userId);
          } catch (error) {
            console.log('⚠️ Token verification failed, continuing with header user');
          }
        }
        
        // Fallback: Extract user from headers
        if (!userId) {
          userId = headersList.get('x-whop-user-id');
          console.log('👤 User ID from headers:', userId);
        }
        
        if (userId && companyId) {
          // Check if user is COMPANY OWNER/ADMIN
          try {
            const companyAccess = await whopSdk.access.checkIfUserHasAccessToCompany({
              userId,
              companyId
            });
            
            console.log('🔑 Company Access Check:', companyAccess);
            
            // Company Owner = Admin Access (check for admin or customer with access)
            if (companyAccess.hasAccess && companyAccess.accessLevel !== 'no_access') {
              console.log('👑 COMPANY OWNER/ADMIN DETECTED');
              console.log(`🎯 Redirecting to admin panel for company: ${companyId}`);
              redirect('/admin');
            }
          } catch (error) {
            console.log('⚠️ Company access check failed:', error);
            // Continue to experience check
          }
        }
        
        // If not company owner, check if regular member
        if (userId && experienceId) {
          try {
            const experienceAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
              userId,
              experienceId
            });
            
            console.log('🎭 Experience Access Check:', experienceAccess);
            
            if (experienceAccess.hasAccess) {
              console.log('👥 COMMUNITY MEMBER DETECTED');
              console.log(`🎯 Redirecting to experience: ${experienceId}`);
              redirect(`/experiences/${experienceId}`);
            }
          } catch (error) {
            console.log('⚠️ Experience access check failed:', error);
          }
        }
        
        // If we have companyId but no valid access, still try admin
        if (companyId && !experienceId) {
          console.log('🔄 No experience ID but have companyId - trying admin access');
          redirect('/admin');
        }
        
      } catch (error) {
        console.log('❌ User verification error:', error);
      }
    }
    
    // Fallback: Show discovery page
    console.log('🔄 No valid Whop context - Redirecting to discovery');
    redirect('/discover');
    
  } catch (error) {
    console.log('❌ Entry point error:', error);
    redirect('/discover');
  }
}

