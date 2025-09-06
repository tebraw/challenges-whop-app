// app/api/admin/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting challenge creation...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 Database URL exists:', !!process.env.DATABASE_URL);
    console.log('🔗 Database URL prefix:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    console.log('🔐 Dev auth enabled:', process.env.ENABLE_DEV_AUTH);
    
    // Log headers for debugging
    const headersList = await headers();
    console.log('📋 Request headers:', {
      authorization: headersList.get('authorization') ? 'Present' : 'None',
      cookie: headersList.get('cookie') ? 'Present' : 'None',
      'content-type': headersList.get('content-type'),
      'user-agent': headersList.get('user-agent')?.substring(0, 50) + '...'
    });
    
    // Check if user is admin (with proper error handling)
    try {
      await requireAdmin();
      console.log('✅ Admin auth successful');
    } catch (authError) {
      console.error('❌ Admin auth failed:', authError);
      console.error('❌ Auth error details:', (authError as Error).message);
      return NextResponse.json({ 
        error: 'Admin access required',
        details: process.env.NODE_ENV === 'development' ? (authError as Error).message : undefined,
        debug: {
          hasAuth: !!headersList.get('authorization'),
          hasCookie: !!headersList.get('cookie'),
          environment: process.env.NODE_ENV
        }
      }, { status: 403 });
    }
    
    const currentUser = await getCurrentUser();
    console.log('👤 Current user:', currentUser?.email || 'No user');
    console.log('👤 User ID:', currentUser?.id || 'No ID');
    console.log('👤 User role:', currentUser?.role || 'No role');
    console.log('👤 Whop Company ID:', currentUser?.whopCompanyId || 'None');
    
    if (!currentUser) {
      console.error('❌ No current user found');
      return NextResponse.json({ 
        error: 'Authentication required',
        debug: {
          environment: process.env.NODE_ENV,
          devAuthEnabled: process.env.ENABLE_DEV_AUTH
        }
      }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log('📝 Received challenge data:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error('❌ Invalid JSON in request:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const {
      title,
      description,
      imageUrl,
      whopCategoryName,
      startAt,
      endAt,
      proofType,
      cadence,
      rules,
      maxParticipants,
      rewards,
      policy
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate user authentication and admin access
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('📝 Creating challenge with user:', currentUser.email);

    // Test database connection first
    let databaseAvailable = true;
    try {
      console.log('🔌 Testing database connection...');
      console.log('🔌 Prisma client status:', !!prisma);
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (dbTestError) {
      console.error('❌ Database connection failed:', dbTestError);
      console.error('❌ DB Error details:', {
        name: (dbTestError as Error).name,
        message: (dbTestError as Error).message,
        stack: (dbTestError as Error).stack?.substring(0, 500)
      });
      databaseAvailable = false;
      
      // Return detailed error information
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? (dbTestError as Error).message : 'Database unavailable',
          suggestion: 'Please check DATABASE_URL environment variable and database connectivity',
          debug: {
            hasDbUrl: !!process.env.DATABASE_URL,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }

    if (!databaseAvailable) {
      // Fallback mode - return mock success for now
      console.log('🚨 Database unavailable, using fallback mode');
      const mockChallenge = {
        id: `challenge-${Date.now()}`,
        title,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
        whopCategoryName: whopCategoryName || 'General',
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        proofType: proofType || 'PHOTO',
        cadence: cadence || 'DAILY',
        createdAt: new Date(),
        tenantId: currentUser.id
      };
      
      return NextResponse.json({
        success: true,
        challenge: mockChallenge,
        message: 'Challenge created (fallback mode - database unavailable)'
      });
    }

    // Create challenge in database
    console.log('💾 Attempting to create challenge in database...');
    console.log('💾 Challenge data to create:', {
      title,
      description: description?.substring(0, 50) + '...',
      imageUrl,
      whopCategoryName,
      tenantId: currentUser.id,
      creatorId: currentUser.id
    });
    
    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
        whopCategoryName: whopCategoryName || 'General',
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        proofType: proofType || 'PHOTO',
        cadence: cadence || 'DAILY',
        rules: rules || {
          minParticipants: 1,
          maxParticipants: maxParticipants || 100,
          dailyCheckIn: true,
          rewards: rewards || [{ place: 1, title: 'Winner', desc: 'Congratulations!' }],
          policy: policy || 'Standard challenge policy'
        },
        tenantId: currentUser.id,
        creatorId: currentUser.id
      }
    });

    console.log('✅ Challenge created in database:', challenge.title);
    console.log('✅ Challenge ID:', challenge.id);
    return NextResponse.json({ 
      success: true,
      challenge,
      message: 'Challenge created successfully'
    });

  } catch (error: any) {
    console.error('❌ Challenge creation error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error.constructor?.name);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A challenge with this title already exists' },
        { status: 409 }
      );
    }

    // Handle database connection errors specifically
    if (error.message?.includes('connect') || error.code?.startsWith('P1')) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Database unavailable',
          debug: {
            errorCode: error.code,
            hasDbUrl: !!process.env.DATABASE_URL,
            environment: process.env.NODE_ENV
          }
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create challenge',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        debug: process.env.NODE_ENV === 'development' ? {
          type: error.constructor?.name,
          code: error.code,
          timestamp: new Date().toISOString()
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    
    // Fetch challenges from database
    const challenges = await prisma.challenge.findMany({
      include: {
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ challenges });

  } catch (error: any) {
    console.error('❌ Error fetching admin challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
