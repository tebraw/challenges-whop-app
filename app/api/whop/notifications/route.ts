import { NextRequest, NextResponse } from 'next/server';
import { whopAppSdk } from '@/lib/whop-sdk-dual';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    console.log('🔔 FULL Notification Request Body:', requestBody);
    
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

    // ✅ NEW: Get Experience ID from Challenge (for proper member targeting)
    let experienceId = null;
    if (challengeId) {
      try {
        console.log('🔍 Looking up Challenge to find Experience ID:', challengeId);
        
        const challenge = await prisma.challenge.findUnique({
          where: { id: challengeId },
          select: { experienceId: true, title: true }
        });

        if (challenge?.experienceId) {
          // 🔍 SMART DETECTION: Check if experienceId is actually a Company ID
          const isCompanyId = challenge.experienceId.startsWith('biz_');
          
          if (isCompanyId) {
            // 🚨 CRITICAL: Challenge stores Company ID as experienceId
            // But user is Experience Member, NOT Company Team Member!
            // Need to find the real Experience ID or use direct targeting
            companyId = challenge.experienceId;
            experienceId = null; // No real Experience ID available
            console.log('� PROBLEM DETECTED: Challenge experienceId is Company ID but user is Experience Member:', {
              challengeId,
              challengeTitle: challenge.title,
              storedAsExperienceId: challenge.experienceId,
              actualType: 'Company ID',
              userType: 'Experience Member (Challenge participant)',
              issue: 'Company Team targeting will fail - user not in Company Team'
            });
          } else {
            // Real Experience ID found
            experienceId = challenge.experienceId;
            console.log('✅ Found Experience ID for Challenge:', {
              challengeId,
              challengeTitle: challenge.title,
              experienceId,
              targetingMethod: 'EXPERIENCE'
            });
          }
        } else {
          console.warn('⚠️ Challenge not found or missing Experience ID:', challengeId);
        }
      } catch (error) {
        console.error('❌ Error looking up Challenge Experience ID:', error);
      }
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

    // Use the correct SDK method name
    const notificationResult = await whopAppSdk.notifications.sendPushNotification(notificationPayload);

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
