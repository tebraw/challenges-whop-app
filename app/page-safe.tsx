// app/page-safe.tsx - Safer version with better error handling
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// Force dynamic rendering for real-time Whop context
export const dynamic = 'force-dynamic';

export default async function SafeHome() {
  console.log('🚀 Safe Experience App - Entry Point with Error Handling');
  
  try {
    const headersList = await headers();
    
    // Extract Whop context with fallbacks
    const whopUserToken = headersList.get('x-whop-user-token');
    const experienceId = headersList.get('x-whop-experience-id') || 
                         headersList.get('x-experience-id') ||
                         headersList.get('X-Whop-Experience-Id');
    
    let companyId = headersList.get('x-whop-company-id') || 
                    headersList.get('x-company-id');
    
    console.log('🔍 Whop Context:', {
      hasToken: !!whopUserToken,
      experienceId: experienceId || 'none',
      companyId: companyId || 'none',
      host: headersList.get('host')
    });
    
    // SAFE ROUTING: Use simple logic without external API calls
    
    // If we have companyId (company owner context)
    if (companyId) {
      console.log('👑 Company context detected - redirecting to admin');
      redirect('/admin');
    }
    
    // If we have experienceId (experience member context)
    if (experienceId) {
      console.log('👥 Experience context detected - redirecting to experience page');
      redirect(`/experiences/${experienceId}`);
    }
    
    // If we have any Whop token but no specific context
    if (whopUserToken) {
      console.log('🔑 Token present but no context - redirecting to admin as fallback');
      redirect('/admin');
    }
    
    // No Whop context at all - show discovery
    console.log('🔄 No Whop context - redirecting to discovery');
    redirect('/discover');
    
  } catch (error) {
    console.error('❌ Safe page error:', error);
    
    // Always have a fallback
    redirect('/discover');
  }
}