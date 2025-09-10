// app/api/debug/create-test-challenge/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { SubscriptionService } from '@/lib/subscription-service';

export async function POST() {
  try {
    console.log('🚀 Testing challenge creation directly...');
    
    // Check admin access first
    console.log('🔐 Checking admin access...');
    await requireAdmin();
    
    const user = await getCurrentUser();
    console.log('👤 Current user:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      tenantId: user?.tenantId,
      whopCompanyId: user?.whopCompanyId
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check subscription limits
    console.log('📊 Checking subscription limits...');
    const canCreateChallenge = await SubscriptionService.checkCanCreateChallenge(user.tenantId);
    console.log('✅ Can create challenge:', canCreateChallenge);
    
    if (!canCreateChallenge.canCreate) {
      return NextResponse.json(
        { 
          error: 'Subscription limit reached',
          message: canCreateChallenge.reason || 'Cannot create more challenges with current subscription'
        },
        { status: 403 }
      );
    }

    // Create a simple test challenge
    console.log('🎯 Creating test challenge...');
    const randomId = Math.random().toString(36).substring(2, 15);
    const challengeData = {
      title: `Debug Test Challenge ${randomId}`,
      description: 'This is a test challenge created via debug API to test challenge creation functionality',
      startAt: new Date(),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      proofType: 'TEXT' as const,
      cadence: 'DAILY' as const,
      imageUrl: '/logo-mark.png',
      rules: {
        maxParticipants: 100,
        difficulty: 'BEGINNER',
        policy: 'This is a test challenge policy. Please follow the basic rules.',
        rewards: [
          {
            place: 1,
            title: 'First Place',
            desc: 'Winner gets bragging rights'
          }
        ]
      },
      marketingTags: ['test', 'debug'],
      targetAudience: { description: 'Testing purposes' },
      whopCategoryName: 'Test',
      monetizationRules: { enabled: false }
    };

    console.log('📝 Challenge data prepared:', challengeData);

    // Ensure tenant exists
    console.log('🏢 Ensuring tenant exists...');
    const tenantId = `tenant_${user.whopCompanyId}`;
    const tenant = await prisma.tenant.upsert({
      where: { id: tenantId },
      create: {
        id: tenantId,
        name: `Company ${user.whopCompanyId} Tenant`,
        whopCompanyId: user.whopCompanyId
      },
      update: {
        whopCompanyId: user.whopCompanyId
      }
    });

    console.log('✅ Tenant ready:', tenant.id);

    // Ensure user is associated with tenant
    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: tenant.id }
    });

    // Create challenge
    console.log('🎯 Creating challenge in database...');
    const newChallenge = await prisma.challenge.create({
      data: {
        tenantId: tenant.id,
        title: challengeData.title,
        description: challengeData.description,
        startAt: challengeData.startAt,
        endAt: challengeData.endAt,
        proofType: challengeData.proofType,
        cadence: challengeData.cadence,
        imageUrl: challengeData.imageUrl,
        creatorId: user.id,
        rules: challengeData.rules,
        marketingTags: challengeData.marketingTags,
        targetAudience: challengeData.targetAudience,
        whopCategoryName: challengeData.whopCategoryName,
        monetizationRules: challengeData.monetizationRules
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    console.log('✅ Challenge created successfully:', newChallenge.id);

    // Increment usage
    await SubscriptionService.incrementChallengeUsage(user.tenantId);
    console.log('📊 Usage incremented');

    return NextResponse.json({ 
      success: true,
      message: 'Test challenge created successfully',
      challengeId: newChallenge.id,
      challenge: newChallenge
    });

  } catch (error) {
    console.error('❌ Challenge creation error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Challenge with this title already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create challenge',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
