// app/page.tsx - Smart Experience App Entry Point
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { whopSdk } from "@/lib/whop-sdk";

// Force dynamic rendering for real-time Whop context
export const dynamic = 'force-dynamic';

export default async function Home() {
  console.log('🚀 Experience App - Smart Entry Point');
  
  try {
    const headersList = await headers();
    
    // Extract Whop context
    const whopUserToken = headersList.get('x-whop-user-token');
    const experienceId = headersList.get('x-whop-experience-id') || 
                         headersList.get('x-experience-id') ||
                         headersList.get('X-Whop-Experience-Id');
    
    console.log('🔍 Whop Context:', {
      hasToken: !!whopUserToken,
      experienceId,
      userAgent: headersList.get('user-agent')?.includes('whop') || false
    });
    
    if (whopUserToken && experienceId) {
      console.log('✅ Valid Whop Experience Context');
      
      try {
        // Verify user and get their role
        const { userId } = await whopSdk.verifyUserToken(headersList);
        console.log('👤 Verified User ID:', userId);
        
        // Extract company context from app config
        const cookieStore = await cookies();
        const appConfigCookie = cookieStore.get('whop.app-config')?.value;
        let companyId = null;
        
        if (appConfigCookie) {
          try {
            const appConfig = JSON.parse(atob(appConfigCookie.split('.')[1]));
            companyId = appConfig.did;
            console.log('🏢 Company ID:', companyId);
          } catch (error) {
            console.log('❌ Failed to parse app config');
          }
        }
        
        // Alternative: Extract from headers
        if (!companyId) {
          companyId = headersList.get('x-whop-company-id') || 
                     headersList.get('x-company-id');
          console.log('🏢 Company ID from headers:', companyId);
        }
        
        if (companyId) {
          // Check if user is company owner/admin
          try {
            const companyAccess = await whopSdk.access.checkIfUserHasAccessToCompany({
              userId,
              companyId
            });
            
            console.log('🔑 Company Access Check:', companyAccess);
            
            if (companyAccess.hasAccess && companyAccess.accessLevel === 'admin') {
              console.log('👑 COMPANY OWNER/ADMIN - Redirecting to Admin Panel');
              redirect('/admin');
            }
          } catch (error) {
            console.log('⚠️ Company access check failed:', error);
          }
        }
        
        // Check experience access for regular members
        try {
          const experienceAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
            userId,
            experienceId
          });
          
          console.log('🎭 Experience Access Check:', experienceAccess);
          
          if (experienceAccess.hasAccess) {
            console.log('👥 COMMUNITY MEMBER - Redirecting to Experience');
            redirect(`/experiences/${experienceId}`);
          } else {
            console.log('❌ No experience access');
          }
        } catch (error) {
          console.log('⚠️ Experience access check failed:', error);
        }
        
      } catch (tokenError) {
        console.log('❌ Token verification failed:', tokenError);
      }
    }
    
    // Fallback: Show generic landing page
    console.log('🔄 Fallback to landing page');
    redirect('/discover');
    
  } catch (error) {
    console.log('❌ Entry point error:', error);
    redirect('/discover');
  }
}

