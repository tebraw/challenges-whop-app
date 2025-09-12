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
            
            // IMPORTANT: In Whop, Company Owners often have "customer" access level
            // but they should get admin access. Check for ANY access to the company.
            if (companyAccess.hasAccess) {
              console.log('👑 COMPANY OWNER/ADMIN DETECTED (has company access)');
              console.log(`🎯 Redirecting to admin panel for company: ${companyId}`);
              redirect('/admin');
            }
          } catch (error) {
            console.log('⚠️ Company access check failed:', error);
            
            // FALLBACK: If user has companyId but access check fails,
            // assume they're company owner (they shouldn't have companyId otherwise)
            console.log('🔄 Fallback: Assuming company owner due to companyId presence');
            redirect('/admin');
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
          console.log('🔄 No experience ID but have companyId - assuming company owner');
          redirect('/admin');
        }
        
        // Additional fallback: If we have companyId at all, give admin access
        // (Company owners should always have companyId in headers)
        if (companyId) {
          console.log('🔄 CompanyId present - giving admin access');
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

