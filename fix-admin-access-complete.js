const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminAccess() {
  console.log('🔧 Repariere Admin Access und erstelle Test-Challenges');
  console.log('='.repeat(60));

  try {
    // 1. Sicherstellen, dass der Admin User korrekt ist
    const adminUser = await prisma.user.findUnique({
      where: { email: 'challengesapp@whop.local' }
    });

    if (!adminUser) {
      console.log('❌ Admin User nicht gefunden - erstelle neuen...');
      const newAdmin = await prisma.user.create({
        data: {
          email: 'challengesapp@whop.local',
          role: 'ADMIN',
          whopCompanyId: '9nmw5yleoqldrxf7n48c',
          tenantId: 'tenant_9nmw5yleoqldrxf7n48c',
          name: 'Admin User'
        }
      });
      console.log(`✅ Admin User erstellt: ${newAdmin.id}`);
    } else {
      console.log(`✅ Admin User gefunden: ${adminUser.id}`);
      
      // Update admin user to ensure correct tenant
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          role: 'ADMIN',
          whopCompanyId: '9nmw5yleoqldrxf7n48c',
          tenantId: 'tenant_9nmw5yleoqldrxf7n48c'
        }
      });
      console.log('✅ Admin User aktualisiert');
    }

    // 2. Sicherstellen, dass der Tenant korrekt ist
    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tenant_9nmw5yleoqldrxf7n48c' }
    });

    if (!tenant) {
      console.log('❌ Tenant nicht gefunden - erstelle neuen...');
      await prisma.tenant.create({
        data: {
          id: 'tenant_9nmw5yleoqldrxf7n48c',
          name: 'Company 9nmw5y',
          whopCompanyId: '9nmw5yleoqldrxf7n48c'
        }
      });
      console.log('✅ Tenant erstellt');
    } else {
      console.log('✅ Tenant gefunden');
    }

    // 3. Erstelle Test-Challenges für den Admin
    console.log('\n🎯 Erstelle Test-Challenges...');
    
    const challenges = [
      {
        title: '30-Day Fitness Challenge',
        description: 'Transform your body in 30 days with daily workouts',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        proofType: 'PHOTO',
        cadence: 'DAILY',
        tenantId: 'tenant_9nmw5yleoqldrxf7n48c',
        creatorId: adminUser.id,
        whopCreatorId: '9nmw5yleoqldrxf7n48c',
        isPublic: true,
        featured: true
      },
      {
        title: 'Daily Reading Challenge',
        description: 'Read for 30 minutes every day',
        startAt: new Date(),
        endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        proofType: 'TEXT',
        cadence: 'DAILY',
        tenantId: 'tenant_9nmw5yleoqldrxf7n48c',
        creatorId: adminUser.id,
        whopCreatorId: '9nmw5yleoqldrxf7n48c',
        isPublic: true,
        featured: false
      },
      {
        title: 'Productivity Sprint',
        description: 'Complete your top 3 tasks every day',
        startAt: new Date(),
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        proofType: 'LINK',
        cadence: 'DAILY',
        tenantId: 'tenant_9nmw5yleoqldrxf7n48c',
        creatorId: adminUser.id,
        whopCreatorId: '9nmw5yleoqldrxf7n48c',
        isPublic: true,
        featured: false
      }
    ];

    for (const challengeData of challenges) {
      const challenge = await prisma.challenge.create({
        data: challengeData
      });
      console.log(`✅ Challenge erstellt: ${challenge.title} (${challenge.id})`);
    }

    // 4. Verify everything is working
    const finalCheck = await prisma.challenge.findMany({
      where: {
        tenantId: 'tenant_9nmw5yleoqldrxf7n48c'
      },
      include: {
        creator: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    console.log(`\n✅ Verification: ${finalCheck.length} Challenges im richtigen Tenant`);
    
    finalCheck.forEach(challenge => {
      console.log(`- ${challenge.title} (Creator: ${challenge.creator?.email})`);
    });

    console.log('\n🎉 Admin Access repariert! Du kannst jetzt:');
    console.log('1. Auf http://localhost:3000/admin zugreifen');
    console.log('2. Challenges sehen und verwalten');
    console.log('3. Zur Subscription-Seite navigieren');

  } catch (error) {
    console.error('❌ Fehler beim Reparieren:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccess().catch(console.error);
