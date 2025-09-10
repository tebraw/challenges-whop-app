// app/api/debug/admin-check/route.ts
import { NextResponse } from 'next/server';
import { isAdmin, getCurrentUser, requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    console.log('🔍 Testing admin check functions...');
    
    // Test getCurrentUser
    console.log('👤 Getting current user...');
    const user = await getCurrentUser();
    console.log('User result:', user);
    
    // Test isAdmin
    console.log('🔐 Testing isAdmin()...');
    const adminResult = await isAdmin();
    console.log('isAdmin result:', adminResult);
    
    // Test requireAdmin
    console.log('🔒 Testing requireAdmin()...');
    try {
      await requireAdmin();
      console.log('requireAdmin passed ✅');
    } catch (error) {
      console.log('requireAdmin failed ❌:', error);
      return NextResponse.json({
        success: false,
        user,
        isAdmin: adminResult,
        requireAdminError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json({
      success: true,
      user,
      isAdmin: adminResult,
      requireAdminPassed: true
    });
    
  } catch (error) {
    console.error('❌ Admin check error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Admin check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
