// create-test-users.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Lösche existierende Test-Benutzer
    await prisma.user.deleteMany({
      where: {
        id: {
          in: ['admin-user', 'normal-user']
        }
      }
    });
    
    // Erstelle oder finde Test-Tenant
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Test-Tenant' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test-Tenant'
        }
      });
    }
    
    // Erstelle Admin-Benutzer
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin-user',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });
    
    // Erstelle normalen Benutzer
    const normalUser = await prisma.user.create({
      data: {
        id: 'normal-user',
        email: 'user@test.com',
        name: 'Normal User', 
        role: 'USER',
        tenantId: tenant.id
      }
    });
    
    console.log('✅ Test-Benutzer erstellt:');
    console.log('Admin:', adminUser);
    console.log('User:', normalUser);
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Test-Benutzer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
