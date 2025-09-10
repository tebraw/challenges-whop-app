// lib/devAuth.ts - Development Authentication Helper
// This file is only used in development mode for testing

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDevUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  tenantId: string;
  whopUserId: string | null;
  whopCompanyId: string | null;
} | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // PRIORITY 1: Check for demo session cookie first
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get('demo-user-id')?.value;
    
    if (demoUserId) {
      console.log('🧪 Using demo session for development authentication');
      const demoUser = await prisma.user.findUnique({
        where: { id: demoUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          tenantId: true,
          whopCompanyId: true,
          whopUserId: true
        }
      });
      
      if (demoUser) {
        console.log(`✅ Demo user loaded: ${demoUser.email} (${demoUser.role})`);
        return demoUser;
      }
    }
  } catch (error) {
    console.log('No demo session found, falling back to default admin...');
  }
  
  // FALLBACK: In development, automatically return the admin user
  console.log('🧪 Using default admin user for development');
  return await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      tenantId: true,
      whopCompanyId: true,
      whopUserId: true
    }
  });
}

export async function isDevAdmin(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  const user = await getDevUser();
  return user?.role === 'ADMIN' || false;
}

export async function requireDevAdmin() {
  const isAdmin = await isDevAdmin();
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}

export async function createDevUser() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development authentication only available in development mode');
  }

  try {
    // Create or find development tenant
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Development-Tenant' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'Development-Tenant' }
      });
    }

    // Create development admin user
    const devAdmin = await prisma.user.upsert({
      where: { id: 'dev-admin' },
      update: {},
      create: {
        id: 'dev-admin',
        email: 'admin@dev.local',
        name: 'Development Admin',
        role: 'ADMIN',
        tenantId: tenant.id,
        whopCompanyId: 'dev-company-id' // Simulate company ownership
      }
    });

    console.log('✅ Development admin user created/updated:', devAdmin.email);
    return devAdmin;
  } catch (error) {
    console.error('❌ Error creating development user:', error);
    throw error;
  }
}
