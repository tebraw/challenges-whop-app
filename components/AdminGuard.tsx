"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface AdminGuardProps {
  children: React.ReactNode;
}

// 🚀 Global Header Injection for Business Dashboard
function setupGlobalHeaderInjection(companyId: string) {
  // Override the global fetch to inject headers for admin API calls
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Convert input to string URL for easier checking
    const url = typeof input === 'string' ? input : 
                input instanceof URL ? input.toString() : 
                input.url;
    
    // Only inject headers for our admin API calls
    if (url.includes('/api/admin/') || url.includes('/api/auth/')) {
      console.log('🎯 Injecting Company ID header for:', url);
      
      // Clone the init object to avoid mutating the original
      const newInit = { ...init };
      newInit.headers = {
        ...newInit.headers,
        'x-whop-company-id': companyId
      };
      
      return originalFetch(input, newInit);
    }
    
    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };
  
  console.log('✅ Global header injection set up for Company ID:', companyId);
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // DEV MODE: Allow admin access for localhost
        if (typeof window !== 'undefined' && window.location.host.includes('localhost')) {
          console.log('🔧 DEV MODE: Granting admin access for localhost');
          setIsAdmin(true);
          setIsChecking(false);
          setDebugInfo({ devMode: true, host: window.location.host });
          return;
        }
        
        console.log('Starting Whop admin access check...');
        
        // 🎯 Business Dashboard Detection
        const isBusinessDashboard = window.location.href.includes('whop.com/dashboard/');
        let businessDashboardCompanyId = null;
        if (isBusinessDashboard) {
          const match = window.location.href.match(/whop\.com\/dashboard\/(biz_[^\/]+)/);
          if (match) {
            businessDashboardCompanyId = match[1];
            console.log('🎯 Business Dashboard detected, Company ID:', businessDashboardCompanyId);
            
            // 🚀 CRITICAL: Set up global header injection for ALL API calls
            setupGlobalHeaderInjection(businessDashboardCompanyId);
          }
        }
        
        // First check experience context and auth status
        const contextHeaders: any = {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // Add Business Dashboard Company ID header if detected
        if (businessDashboardCompanyId) {
          contextHeaders['x-whop-company-id'] = businessDashboardCompanyId;
        }
        
        const contextResponse = await fetch('/api/auth/experience-context', {
          method: 'GET',
          headers: contextHeaders,
          credentials: 'include'
        });
        
        if (!contextResponse.ok) {
          throw new Error(`Experience context API failed: ${contextResponse.status} ${contextResponse.statusText}`);
        }
        
        const contextData = await contextResponse.json();
        
        console.log('Experience context:', contextData);
        
        // Check if there's an error in the response
        if (contextData.error) {
          console.log('Experience context error - trying admin API directly:', contextData.error);
          // Don't throw immediately, try admin API first
        }
        
        // 🎯 FLEXIBLE AUTH: Try admin API even if experience context has issues
        // This handles cases where user is authenticated in Whop but our context detection fails
        
        if (!contextData.isAuthenticated && !contextData.userId) {
          console.log('No authentication detected - redirecting to Whop login');
          window.location.href = '/auth/whop';
          return;
        }
        
        // Skip role check if we have userId but role mapping failed
        const shouldSkipRoleCheck = contextData.userId && contextData.userRole === 'guest';
        
        // Check for fallback company ID problem - REMOVED hardcoded check
        // Instead, check if company ID looks suspicious (too short, wrong format, etc.)
        const hasFallbackCompanyId = !contextData.companyId || 
                                     contextData.companyId.length < 10 || 
                                     !contextData.companyId.startsWith('biz_');
        
        if (hasFallbackCompanyId) {
          console.log('🚨 Fallback Company ID detected - checking if this is Business Dashboard access');
          
          // SPECIAL CASE: Business Dashboard access often has fallback company ID
          // but the user is still a valid company owner. Let's try to extract the real company ID.
          const currentUrl = window.location.href;
          
          // Extract real company ID from Business Dashboard URL pattern
          const businessDashboardMatch = currentUrl.match(/whop\.com\/dashboard\/(biz_[^\/]+)/);
          if (businessDashboardMatch) {
            const realCompanyId = businessDashboardMatch[1];
            console.log(`🎯 Business Dashboard detected! Real company ID: ${realCompanyId}`);
            
            // Update context with real company ID and skip fallback cleanup
            contextData.companyId = realCompanyId;
            console.log('🔄 Using real company ID for admin access...');
            
            // 🚀 CRITICAL: Initialize user in database for Business Dashboard access
            try {
              console.log('🔄 Initializing user in database...');
              const initUserResponse = await fetch('/api/auth/init-user', {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache',
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'x-whop-company-id': realCompanyId
                },
                credentials: 'include'
              });
              
              if (initUserResponse.ok) {
                const initData = await initUserResponse.json();
                console.log('✅ User initialized successfully:', initData.user);
              } else {
                const errorData = await initUserResponse.json();
                console.log('⚠️  User initialization failed:', errorData);
              }
            } catch (initError) {
              console.log('⚠️  User initialization error:', initError);
            }
            
            // Allow the normal admin flow to continue
          } else {
            console.log('🚨 Genuine fallback Company ID - trying to clean up and re-authenticate');
          
          // First, try to clean up the fallback user
          try {
            const cleanupResponse = await fetch('/api/auth/cleanup-fallback', {
              method: 'POST',
              headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include'
            });
            
            if (cleanupResponse.ok) {
              const cleanupData = await cleanupResponse.json();
              console.log('✅ Cleanup successful:', cleanupData);
              
              if (cleanupData.action === 'user_deleted') {
                console.log('🔄 User deleted - attempting re-authentication');
                
                // Try Company Owner Access API after cleanup
                const companyOwnerResponse = await fetch('/api/auth/company-owner-access', {
                  method: 'GET',
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  credentials: 'include'
                });
                
                if (companyOwnerResponse.ok) {
                  const companyOwnerData = await companyOwnerResponse.json();
                  console.log('✅ Re-authentication successful:', companyOwnerData);
                  
                  if (companyOwnerData.success && companyOwnerData.user.role === 'ADMIN') {
                    setIsAdmin(true);
                    setDebugInfo({ 
                      success: true, 
                      accessMethod: 'cleanup_and_reauth',
                      userType: companyOwnerData.userType,
                      user: companyOwnerData.user,
                      cleanupResult: cleanupData
                    });
                    return;
                  }
                }
              }
            }
          } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError);
          }
            
            // If cleanup didn't work, show error
            setDebugInfo({ 
              success: false, 
              error: 'Fallback Company ID detected',
              debug: 'Please access the app via the Whop experience or app download to get proper authentication',
              status: 400,
              experienceContext: contextData,
              fallbackCompanyId: true,
              recommendation: 'Access via Whop app or experience to fix authentication'
            });
            return;
          }
        }
        
        if (!shouldSkipRoleCheck && contextData.userRole !== 'ersteller') {
          console.log('Not admin role - trying admin API anyway');
          // Don't redirect immediately, try admin API first
        }
        
        // User is authenticated and has admin role - now test admin API access
        const adminHeaders: any = {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // 🎯 CRITICAL: Use Business Dashboard Company ID or fallback to context
        const companyIdForAdmin = businessDashboardCompanyId || contextData.companyId;
        if (companyIdForAdmin) {
          adminHeaders['x-whop-company-id'] = companyIdForAdmin;
          console.log('🎯 Adding Company ID to admin call:', companyIdForAdmin);
        }
        
        const adminResponse = await fetch('/api/admin/challenges', {
          method: 'GET',
          headers: adminHeaders,
          credentials: 'include'
        });
        console.log('Admin challenges API response status:', adminResponse.status);
        
        if (adminResponse.ok) {
          console.log('Admin access granted!');
          setIsAdmin(true);
          
          const data = await adminResponse.json();
          setDebugInfo({ 
            success: true, 
            experienceContext: contextData,
            challengeCount: data.challenges?.length || 0
          });
        } else {
          const errorData = await adminResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.log('Admin API access denied:', errorData);
          
          // Check if this is just an auth issue that can be resolved
          if (adminResponse.status === 401 && !contextData.isAuthenticated) {
            console.log('Authentication required - redirecting to Whop login');
            window.location.href = '/auth/whop';
            return;
          }
          
          if (adminResponse.status === 403 && contextData.userRole !== 'ersteller') {
            console.log('Admin role required - redirecting to plans');
            router.push('/plans?reason=admin_access_required');
            return;
          }
          
          setDebugInfo({ 
            success: false, 
            error: errorData.error,
            debug: errorData.debug,
            status: adminResponse.status,
            experienceContext: contextData,
            headers: errorData.headers
          });
        }
      } catch (error: any) {
        console.error('Experience context error:', error);
        setDebugInfo({ 
          error: error?.message || 'Network error', 
          networkError: true,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 50) + '...'
        });
      } finally {
        setIsChecking(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  if (isChecking) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Access verification in progress...</p>
          
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
              <h3 className="font-bold mb-2">Debug Information:</h3>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
