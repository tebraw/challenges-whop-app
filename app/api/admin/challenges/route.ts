// app/api/admin/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting challenge creation...');
    
    // Check if user is admin (with proper error handling)
    try {
      await requireAdmin();
    } catch (authError) {
      console.error('❌ Admin auth failed:', authError);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const currentUser = await getCurrentUser();
    console.log('👤 Current user:', currentUser?.email || 'No user');
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log('📝 Received challenge data:', body);
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
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (dbTestError) {
      console.error('❌ Database connection failed:', dbTestError);
      databaseAvailable = false;
      
      // For now, return a detailed error but allow for fallback in the future
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? (dbTestError as Error).message : 'Internal error',
          suggestion: 'Please ensure DATABASE_URL environment variable is set correctly'
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
    return NextResponse.json({ 
      success: true,
      challenge,
      message: 'Challenge created successfully'
    });

  } catch (error: any) {
    console.error('❌ Challenge creation error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A challenge with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create challenge',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
