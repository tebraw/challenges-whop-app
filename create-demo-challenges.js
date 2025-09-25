const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDemoChallenges() {
  console.log('🚀 Creating demo challenges for screenshots...\n');

  try {
    // Use existing tenant with users for demo challenges
    const tenant = await prisma.tenant.findFirst({
      where: { whopCompanyId: 'biz_YoIIIT73rXwrtK' },
      include: {
        users: true
      }
    });

    if (!tenant) {
      console.log('❌ Target tenant not found. Please run check-tenants.js first');
      return;
    }
    
    console.log(`✅ Using existing tenant: ${tenant.name} (${tenant.id})`);
    console.log(`👥 Users in tenant: ${tenant.users.length}`);

    // 1. FITNESS CHALLENGE
    const fitnessChallenge = await prisma.challenge.create({
      data: {
        title: '30-Day Fitness Transformation',
        description: 'Transform your body and build lasting healthy habits in just 30 days. Complete daily workouts, track your nutrition, and join a community of motivated individuals on the same journey.',
        cadence: 'DAILY',
        proofType: 'PHOTO',
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        tenantId: tenant.id,
        experienceId: 'exp_fitness_demo',
        difficulty: 'BEGINNER',
        isPublic: true,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center'
      }
    });

    // 2. FINANCE CHALLENGE
    const financeChallenge = await prisma.challenge.create({
      data: {
        title: 'Financial Freedom in 90 Days',
        description: 'Master your money and build wealth with proven strategies. Learn budgeting, saving, investing, and create multiple income streams while tracking your progress daily.',
        cadence: 'DAILY',
        proofType: 'TEXT',
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        tenantId: tenant.id,
        experienceId: 'exp_finance_demo',
        difficulty: 'INTERMEDIATE',
        isPublic: true,
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&crop=center'
      }
    });

    // 3. BUSINESS CHALLENGE
    const businessChallenge = await prisma.challenge.create({
      data: {
        title: 'Launch Your Side Business',
        description: 'Turn your idea into a profitable side business in 60 days. From market research to first customer, this challenge provides step-by-step guidance and accountability.',
        cadence: 'DAILY',
        proofType: 'TEXT',
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        tenantId: tenant.id,
        experienceId: 'exp_business_demo',
        difficulty: 'ADVANCED',
        isPublic: true,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=center'
      }
    });

    // 4. PRODUCTIVITY CHALLENGE
    const productivityChallenge = await prisma.challenge.create({
      data: {
        title: 'Master Your Morning Routine',
        description: 'Build the perfect morning routine that sets you up for success every day. Develop consistent habits that boost productivity, energy, and focus throughout the day.',
        cadence: 'DAILY',
        proofType: 'PHOTO',
        status: 'ACTIVE',
        startAt: new Date(),
        endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        tenantId: tenant.id,
        experienceId: 'exp_productivity_demo',
        difficulty: 'BEGINNER',
        isPublic: true,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center'
      }
    });

    console.log('✅ Demo challenges created successfully!\n');
    
    console.log('📊 CREATED CHALLENGES:');
    console.log(`1. 🏋️ Fitness: ${fitnessChallenge.title} (ID: ${fitnessChallenge.id})`);
    console.log(`2. 💰 Finance: ${financeChallenge.title} (ID: ${financeChallenge.id})`);
    console.log(`3. 🚀 Business: ${businessChallenge.title} (ID: ${businessChallenge.id})`);
    console.log(`4. ⏰ Productivity: ${productivityChallenge.title} (ID: ${productivityChallenge.id})`);
    
    console.log('\n🌐 WHERE TO VIEW FOR SCREENSHOTS:');
    console.log('\n📋 ADMIN DASHBOARD VIEW:');
    console.log(`http://localhost:3000/admin/c/${fitnessChallenge.id}`);
    console.log(`http://localhost:3000/admin/c/${financeChallenge.id}`);
    console.log(`http://localhost:3000/admin/c/${businessChallenge.id}`);
    console.log(`http://localhost:3000/admin/c/${productivityChallenge.id}`);
    
    console.log('\n👥 EXPERIENCE VIEW (Member/User perspective):');
    console.log(`http://localhost:3000/experiences/exp_fitness_demo/c/${fitnessChallenge.id}`);
    console.log(`http://localhost:3000/experiences/exp_finance_demo/c/${financeChallenge.id}`);
    console.log(`http://localhost:3000/experiences/exp_business_demo/c/${businessChallenge.id}`);
    console.log(`http://localhost:3000/experiences/exp_productivity_demo/c/${productivityChallenge.id}`);
    
    console.log('\n🗑️ TO DELETE THESE CHALLENGES LATER:');
    console.log('Run: node delete-demo-challenges.js');
    
    console.log(`\n💡 TENANT ID: ${tenant.id} (use this for admin access)`);

  } catch (error) {
    console.error('❌ Error creating demo challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoChallenges();