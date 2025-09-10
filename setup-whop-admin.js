const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createWhopAdminUser() {
  console.log('🔧 Creating Whop-compatible admin user...');
  console.log('='.repeat(50));

  try {
    // Check environment to see what Whop Company ID we should use
    console.log('Environment variables:');
    console.log('- NEXT_PUBLIC_WHOP_COMPANY_ID:', process.env.NEXT_PUBLIC_WHOP_COMPANY_ID);
    console.log('- WHOP_COMPANY_ID:', process.env.WHOP_COMPANY_ID);
    
    // Use the actual Whop Company ID from environment or fallback
    const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 
                         process.env.WHOP_COMPANY_ID || 
                         '9nmw5yleoqldrxf7n48c';
    
    const tenantId = `tenant_${whopCompanyId}`;
    
    console.log('Using Whop Company ID:', whopCompanyId);
    console.log('Using Tenant ID:', tenantId);
    
    // 1. Ensure tenant exists
    const tenant = await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {
        whopCompanyId: whopCompanyId,
        name: `Company ${whopCompanyId.slice(-6)}`
      },
      create: {
        id: tenantId,
        name: `Company ${whopCompanyId.slice(-6)}`,
        whopCompanyId: whopCompanyId
      }
    });
    console.log('✅ Tenant ready:', tenant.name);

    // 2. Create/update admin user that will work in Whop
    const adminEmail = 'challengesapp@whop.local';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    let adminUser;
    if (existingAdmin) {
      adminUser = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          role: 'ADMIN',
          whopCompanyId: whopCompanyId,
          tenantId: tenantId,
          name: 'Challenges App Admin'
        }
      });
      console.log('✅ Updated existing admin user');
    } else {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Challenges App Admin',
          role: 'ADMIN',
          whopCompanyId: whopCompanyId,
          tenantId: tenantId
        }
      });
      console.log('✅ Created new admin user');
    }

    // 3. Also create a fallback admin user that can work with any Whop user ID
    // This is for when someone installs the app and becomes the admin
    const fallbackAdminEmail = `admin@${whopCompanyId}.whop.local`;
    await prisma.user.upsert({
      where: { email: fallbackAdminEmail },
      update: {
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId
      },
      create: {
        email: fallbackAdminEmail,
        name: 'App Installer Admin',
        role: 'ADMIN',
        whopCompanyId: whopCompanyId,
        tenantId: tenantId
      }
    });
    console.log('✅ Created fallback admin user');

    // 4. Create test challenges if they don't exist
    const existingChallenges = await prisma.challenge.count({
      where: { tenantId: tenantId }
    });

    if (existingChallenges === 0) {
      console.log('Creating test challenges...');
      
      const challenges = [
        {
          title: '🏃‍♂️ 30-Day Fitness Challenge',
          description: 'Transform your body in 30 days with daily workouts and healthy habits',
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          proofType: 'PHOTO',
          cadence: 'DAILY',
          tenantId: tenantId,
          creatorId: adminUser.id,
          whopCreatorId: whopCompanyId,
          isPublic: true,
          featured: true,
          category: 'fitness',
          difficulty: 'BEGINNER'
        },
        {
          title: '📚 Daily Reading Challenge',
          description: 'Read for 30 minutes every day and expand your knowledge',
          startAt: new Date(),
          endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          proofType: 'TEXT',
          cadence: 'DAILY',
          tenantId: tenantId,
          creatorId: adminUser.id,
          whopCreatorId: whopCompanyId,
          isPublic: true,
          featured: false,
          category: 'education',
          difficulty: 'BEGINNER'
        },
        {
          title: '⚡ Productivity Sprint',
          description: 'Complete your top 3 most important tasks every day',
          startAt: new Date(),
          endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          proofType: 'LINK',
          cadence: 'DAILY',
          tenantId: tenantId,
          creatorId: adminUser.id,
          whopCreatorId: whopCompanyId,
          isPublic: true,
          featured: false,
          category: 'productivity',
          difficulty: 'INTERMEDIATE'
        }
      ];

      for (const challengeData of challenges) {
        const challenge = await prisma.challenge.create({
          data: challengeData
        });
        console.log(`✅ Created challenge: ${challenge.title}`);
      }
    } else {
      console.log(`✅ Found ${existingChallenges} existing challenges`);
    }

    // 5. Create/update subscription
    const existingSub = await prisma.whopSubscription.findFirst({
      where: { tenantId: tenantId }
    });

    let subscription;
    if (existingSub) {
      subscription = await prisma.whopSubscription.update({
        where: { id: existingSub.id },
        data: {
          whopProductId: 'prod_YByUE3J5oT4Fq',
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ Updated existing subscription');
    } else {
      subscription = await prisma.whopSubscription.create({
        data: {
          tenantId: tenantId,
          whopProductId: 'prod_YByUE3J5oT4Fq',
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ Created new subscription');
    }

    // 6. Update monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const challengeCount = await prisma.challenge.count({
      where: { tenantId: tenantId }
    });
    
    await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month: {
          tenantId: tenantId,
          month: currentMonth
        }
      },
      update: {
        challengesCreated: challengeCount
      },
      create: {
        tenantId: tenantId,
        month: currentMonth,
        challengesCreated: challengeCount
      }
    });
    console.log('✅ Usage tracking updated');

    console.log('\n🎉 Whop admin setup complete!');
    console.log('\n📊 Summary:');
    console.log(`- Whop Company ID: ${whopCompanyId}`);
    console.log(`- Tenant ID: ${tenantId}`);
    console.log(`- Admin Email: ${adminUser.email}`);
    console.log(`- Challenges: ${challengeCount}`);
    console.log(`- Subscription: Active (Basic Plan)`);
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Deploy this to your production environment');
    console.log('2. Access admin via Whop app iframe');
    console.log('3. Admin access will be granted automatically to app installer');

  } catch (error) {
    console.error('❌ Error setting up Whop admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createWhopAdminUser().catch(console.error);
