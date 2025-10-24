import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// GET /api/admin/dashboard/challenges - Dashboard-specific route (uses companyId instead of experienceId)
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Dashboard uses company ID from header (set by client)
    const companyId = headersList.get('x-whop-company-id') || 
                     headersList.get('x-company-id');
    
    if (!companyId) {
      return NextResponse.json({ 
        error: 'Company ID required',
        debug: 'No companyId found in headers. Dashboard must send x-whop-company-id header.'
      }, { status: 400 });
    }

    console.log('📊 Dashboard API: Fetching challenges for company:', companyId);

    // Get tenant by company ID
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: companyId }
    });

    if (!tenant) {
      // Create tenant if doesn't exist
      tenant = await prisma.tenant.create({
        data: {
          name: `Company ${companyId}`,
          whopCompanyId: companyId
        }
      });
      console.log('✅ Created new tenant for company:', companyId);
    }

    // Fetch all challenges for this tenant/company
    const challenges = await prisma.challenge.findMany({
      where: {
        tenantId: tenant.id
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${challenges.length} challenges for tenant ${tenant.id}`);

    // Transform to match Dashboard's expected format
    const formattedChallenges = challenges.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      startDate: c.startAt?.toISOString() || new Date().toISOString(),
      endDate: c.endAt?.toISOString() || new Date().toISOString(),
      proofType: c.proofType || 'TEXT',
      rules: c.rules,
      createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
      enrollmentCount: c._count?.enrollments || 0,
      imageUrl: c.imageUrl || null
    }));

    return NextResponse.json({ 
      challenges: formattedChallenges,
      companyId,
      tenantId: tenant.id
    });

  } catch (error: any) {
    console.error('❌ Dashboard challenges API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch challenges',
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/admin/dashboard/challenges - Create challenge (Dashboard-specific)
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const companyId = headersList.get('x-whop-company-id') || 
                     headersList.get('x-company-id');
    
    if (!companyId) {
      return NextResponse.json({ 
        error: 'Company ID required' 
      }, { status: 400 });
    }

    const body = await request.json();

    // Get or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { whopCompanyId: companyId }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: `Company ${companyId}`,
          whopCompanyId: companyId
        }
      });
    }

    // Create challenge
    const challenge = await prisma.challenge.create({
      data: {
        tenantId: tenant.id,
        experienceId: body.experienceId || companyId, // Fallback to companyId
        title: body.title,
        description: body.description,
        startAt: new Date(body.startDate || body.startAt),
        endAt: new Date(body.endDate || body.endAt),
        proofType: body.proofType || 'TEXT',
        cadence: body.cadence || 'DAILY',
        rules: body.rules || null,
        imageUrl: body.imageUrl || null,
        isPublic: body.isPublic ?? true,
        featured: body.featured ?? false
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    console.log('✅ Challenge created via Dashboard API:', challenge.id);

    // Format response
    const formatted = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      startDate: challenge.startAt.toISOString(),
      endDate: challenge.endAt.toISOString(),
      proofType: challenge.proofType,
      rules: challenge.rules,
      createdAt: challenge.createdAt.toISOString(),
      enrollmentCount: challenge._count?.enrollments || 0,
      imageUrl: challenge.imageUrl
    };

    return NextResponse.json({ 
      challenge: formatted,
      success: true 
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Dashboard create challenge error:', error);
    return NextResponse.json({ 
      error: 'Failed to create challenge',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/admin/dashboard/challenges?id=xxx - Delete challenge (Dashboard-specific)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('id');

    if (!challengeId) {
      return NextResponse.json({ 
        error: 'Challenge ID required' 
      }, { status: 400 });
    }

    // Delete challenge
    await prisma.challenge.delete({
      where: { id: challengeId }
    });

    console.log('✅ Challenge deleted via Dashboard API:', challengeId);

    return NextResponse.json({ 
      success: true,
      message: 'Challenge deleted' 
    });

  } catch (error: any) {
    console.error('❌ Dashboard delete challenge error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete challenge',
      details: error.message 
    }, { status: 500 });
  }
}
