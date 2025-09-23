import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-dual';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('=== 🔔 WHOP NOTIFICATION API CALLED ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🌐 Request Method:', request.method);
  console.log('📍 Request URL:', request.url);
  
  try {
    const requestBody = await request.json();
    
    console.log('� FULL Notification Request Body:', JSON.stringify(requestBody, null, 2));
    
    const { 
      whopUserId, 
      message, 
      title, 
      deepLink,
      challengeTitle,
      challengeId,  // ← NEW: Challenge ID to find Experience ID
      // Legacy support for old API format
      recipient,
      userEmail 
    } = requestBody;

    console.log('🔔 Sending Whop Push Notification:', {
      whopUserId,
      title: title || 'Challenge Update',
      message: message?.substring(0, 50) + '...',
      deepLink,
      challengeId,
      challengeIdType: typeof challengeId,
      challengeIdExists: !!challengeId,
      allKeys: Object.keys(requestBody)
    });

    // Validate required fields
    if (!whopUserId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: whopUserId and message' },
        { status: 400 }
      );
    }

    // Enhanced Company ID detection from multiple sources (declare first)
    const headers = Object.fromEntries(request.headers.entries());
    const companyIdFromHeader = request.headers.get('X-Whop-Company-ID') || request.headers.get('x-whop-company-id');
    
    // Extract Company ID from referer URL (Dashboard App pattern)
    const referer = request.headers.get('referer') || '';
    const companyIdFromUrl = referer.match(/\/dashboard\/([^\/]+)/)?.[1];
    
    // Extract from origin if Dashboard App
    const origin = request.headers.get('origin') || '';
    const isFromDashboardApp = origin.includes('.apps.whop.com');
    
    let companyId = companyIdFromHeader || companyIdFromUrl;

    // 🎯 ENHANCED: Get REAL Experience ID from User's membership via headers
    let experienceId = null;
    let userRealExperienceId = null;
    
    // First: Try to get Experience ID from request headers (most reliable)
    const headerExperienceId = request.headers.get('X-Experience-ID') || 
                              request.headers.get('x-experience-id') ||
                              request.headers.get('x-whop-experience-id');
    
    if (headerExperienceId && headerExperienceId.startsWith('exp_')) {
      userRealExperienceId = headerExperienceId;
      console.log('✅ Found real Experience ID from headers:', {
        experienceId: userRealExperienceId,
        source: 'request headers'
      });
    }
    
    // Second: Try to extract Experience ID from referer URL pattern
    if (!userRealExperienceId) {
      const referer = request.headers.get('referer') || '';
      const experienceMatch = referer.match(/\/experiences\/([^\/]+)/);
      if (experienceMatch && experienceMatch[1].startsWith('exp_')) {
        userRealExperienceId = experienceMatch[1];
        console.log('✅ Found real Experience ID from referer URL:', {
          experienceId: userRealExperienceId,
          referer: referer,
          source: 'URL parsing'
        });
      }
    }
    
    // Third: Try to get user's Experience membership via Whop SDK
    if (!userRealExperienceId) {
      try {
        console.log('🔍 Checking user Experience access via Whop SDK:', whopUserId);
        
        // Check if user has access to known experiences
        const commonExperienceIds = [
          'exp_3qrneD6jdqZOTm', // Common pattern from logs
          companyId?.replace('biz_', 'exp_') // Try converting Company ID to Experience ID pattern
        ].filter(Boolean);
        
        for (const testExpId of commonExperienceIds) {
          if (!testExpId) continue; // Skip undefined/null values
          
          try {
            const hasAccess = await whopAppSdk.access.checkIfUserHasAccessToExperience({
              userId: whopUserId,
              experienceId: testExpId
            });
            
            if (hasAccess) {
              userRealExperienceId = testExpId;
              console.log('✅ Found user real Experience ID via access check:', {
                userId: whopUserId,
                experienceId: testExpId,
                hasAccess: true,
                source: 'SDK access check'
              });
              break;
            }
          } catch (accessError) {
            console.log('❌ No access to experience:', testExpId);
          }
        }
      } catch (error) {
        console.error('❌ Error checking user Experience access:', error);
      }
    }
    
    // Fourth: Get Challenge's stored experienceId (might be Company ID)
    if (challengeId) {
      try {
        console.log('🔍 Looking up Challenge to find stored Experience ID:', challengeId);
        
        const challenge = await prisma.challenge.findUnique({
          where: { id: challengeId },
          select: { experienceId: true, title: true }
        });

        if (challenge?.experienceId) {
          // 🔍 SMART DETECTION: Check if experienceId is actually a Company ID
          const isCompanyId = challenge.experienceId.startsWith('biz_');
          
          if (isCompanyId) {
            // 🚨 CRITICAL: Challenge stores Company ID as experienceId
            // Use user's REAL Experience ID instead!
            companyId = challenge.experienceId;
            experienceId = userRealExperienceId; // Use user's real Experience ID!
            console.log('🎯 SOLUTION: Using user real Experience ID instead of Company ID:', {
              challengeId,
              challengeTitle: challenge.title,
              challengeStoredId: challenge.experienceId,
              challengeStoredType: 'Company ID',
              userRealExperienceId: userRealExperienceId,
              usingExperienceId: experienceId,
              targetingMethod: experienceId ? 'REAL_EXPERIENCE' : 'COMPANY_FALLBACK'
            });
          } else {
            // Real Experience ID found in Challenge
            experienceId = challenge.experienceId;
            console.log('✅ Found valid Experience ID in Challenge:', {
              challengeId,
              challengeTitle: challenge.title,
              experienceId,
              targetingMethod: 'EXPERIENCE'
            });
          }
        } else {
          console.warn('⚠️ Challenge not found or missing Experience ID:', challengeId);
          // Use user's real Experience ID as fallback
          experienceId = userRealExperienceId;
        }
      } catch (error) {
        console.error('❌ Error looking up Challenge Experience ID:', error);
        // Use user's real Experience ID as fallback
        experienceId = userRealExperienceId;
      }
    } else {
      // No Challenge ID provided, use user's real Experience ID
      experienceId = userRealExperienceId;
    }
    
    console.log('🔍 ENHANCED Company ID Detection:', {
      'Header X-Whop-Company-ID': companyIdFromHeader,
      'URL Company ID': companyIdFromUrl,
      'Final Company ID': companyId,
      'Referer': referer,
      'Origin': origin,
      'Is Dashboard App': isFromDashboardApp,
      'All headers': headers
    });

    if (!companyId) {
      console.error('❌ No Company ID found in headers OR URL');
      console.log('📋 Available headers:', headers);
      return NextResponse.json(
        { 
          error: 'Company ID required for notifications',
          debug: {
            message: 'No Company ID found in X-Whop-Company-ID header or dashboard URL',
            referer: referer,
            origin: origin,
            isDashboardApp: isFromDashboardApp,
            suggestion: 'Ensure calling from Dashboard App with company context'
          },
          availableHeaders: headers
        },
        { status: 400 }
      );
    }

    console.log('🏢 Company ID detected:', companyId);

    // ✅ SMART TARGETING: Check if experienceId is valid Experience format
    const isValidExperienceId = experienceId && experienceId.startsWith('exp_');
    
    console.log('🎯 Targeting Decision:', {
      experienceId,
      isValidExperienceId,
      companyId,
      targetingMethod: isValidExperienceId ? 'EXPERIENCE' : 'COMPANY_TEAM'
    });

    // 🎯 EXPERIENCE MEMBER TARGETING: User is Challenge participant, not Company Team member
    let notificationPayload: any;
    let targetingStrategy = 'UNKNOWN';
    
    if (isValidExperienceId) {
      // ✅ EXPERIENCE TARGETING: Real Experience ID found
      notificationPayload = {
        experienceId: experienceId,
        title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
        content: message,
        userIds: [whopUserId],
        targets: { experience: true },  // ✅ FIXED: Added required targets field for experience notifications
        isMention: true
      };
      targetingStrategy = 'EXPERIENCE';
    } else {
      // 🔄 DIRECT USER TARGETING: For Experience Members without valid Experience ID
      // User is Challenge participant but Challenge stores Company ID instead of Experience ID
      console.log('🎯 Using DIRECT USER targeting for Experience Member:', {
        reason: 'User is Challenge participant, not Company Team member',
        challengeStores: 'Company ID as experienceId',
        userAccess: 'Experience Member only',
        solution: 'Direct user notification'
      });
      
      notificationPayload = {
        title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
        content: message,
        userIds: [whopUserId],
        targets: { user: true },  // ✅ FIXED: Added required targets field for direct user notifications
        isMention: true
      };
      targetingStrategy = 'DIRECT_USER_EXPERIENCE_MEMBER';
    }

    console.log('📡 Sending Notification:', {
      method: targetingStrategy,
      experienceId: isValidExperienceId ? experienceId : null,
      companyId: companyId || null,
      userIds: [whopUserId],
      payload: notificationPayload
    });

    // ✅ FIXED: Use correct SendNotificationInput structure without targets field
    let notificationResult;
    
    if (isValidExperienceId) {
      // Experience targeting with experienceId
      notificationResult = await whopAppSdk.notifications.sendPushNotification({
        experienceId: experienceId,
        title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
        content: message,
        userIds: [whopUserId]
      });
    } else {
      // 🎯 EXPERIENCE MEMBER ACCESS: User is Challenge participant
      // Challenge stores Company ID as experienceId, but user has Experience Member access
      // Need to use Experience ID targeting even though it's stored as Company ID
      
      console.log('🎯 Experience Member Targeting: Challenge participant needs Experience access');
      console.log('📝 Challenge stores Company ID as experienceId - converting to Experience targeting');
      
      // Try Experience ID targeting using the Company ID (stored as experienceId in Challenge)
      notificationResult = await whopAppSdk.notifications.sendPushNotification({
        experienceId: companyId,  // ← Use Company ID as Experience ID (how Challenge stores it)
        title: title || `🏆 ${challengeTitle || 'Challenge'} Update`,
        content: message,
        userIds: [whopUserId]
      });
      
      targetingStrategy = 'EXPERIENCE_MEMBER_VIA_COMPANY_ID';
    }

    console.log('✅ Whop Push Notification sent successfully:', {
      whopUserId,
      experienceId: isValidExperienceId ? experienceId : null,
      companyId,
      notificationSent: notificationResult,
      status: 'sent',
      targetingMethod: targetingStrategy
    });

    return NextResponse.json({
      success: true,
      message: `Push notification sent successfully via ${targetingStrategy} targeting`,
      notificationSent: notificationResult,
      experienceId: isValidExperienceId ? experienceId : null,
      companyId,
      targetingMethod: isValidExperienceId ? 'EXPERIENCE_MEMBERS' : 'COMPANY_TEAM',
      whopUserId,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending Whop push notification:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to send push notification',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
