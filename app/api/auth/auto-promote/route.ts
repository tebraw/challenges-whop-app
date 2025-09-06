import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getExperienceContext } from '@/lib/whop-experience';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Auto-promoting user to Company Owner...');
    
    // Get experience context
    const experienceContext = await getExperienceContext();
    console.log('🖼️ Experience context:', experienceContext);
    
    // Get current user
    const currentUser = await getCurrentUser();
    console.log('👤 Current user:', currentUser);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }
    
    // If user is already admin with company ID, no need to update
    if (currentUser.role === 'ADMIN' && currentUser.whopCompanyId) {
      return NextResponse.json({
        success: true,
        message: 'User is already Company Owner',
        user: currentUser
      });
    }
    
    // Auto-promote: If user accesses via Whop Experience, they're likely Company Owner
    const isFromWhopExperience = experienceContext.isEmbedded || 
                                 req.headers.get('referer')?.includes('whop.com');
    
    if (isFromWhopExperience && experienceContext.userId && experienceContext.companyId) {
      console.log('🎯 Auto-promoting user from Whop Experience to Company Owner');
      
      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          role: 'ADMIN',
          whopCompanyId: experienceContext.companyId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'User automatically promoted to Company Owner',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          whopCompanyId: updatedUser.whopCompanyId
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'User cannot be auto-promoted',
      context: {
        isFromWhopExperience,
        hasUserId: !!experienceContext.userId,
        hasCompanyId: !!experienceContext.companyId
      }
    });
    
  } catch (error: any) {
    console.error('❌ Auto-promotion error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
