// scripts/create-test-data.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🌱 Creating test data...');

  try {
    // Create tenant first (or find existing)
    const tenant = await prisma.tenant.upsert({
      where: { id: 'whop_company_1' },
      update: {},
      create: {
        id: 'whop_company_1',
        name: 'Test Whop Company',
        createdAt: new Date()
      }
    });

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        id: 'user_test_1',
        email: 'test1@example.com',
        name: 'Test User 1',
        role: 'USER',
        whopUserId: 'whop_user_1',
        tenantId: tenant.id,
        createdAt: new Date()
      }
    });

    const user2 = await prisma.user.create({
      data: {
        id: 'user_test_2', 
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'USER',
        whopUserId: 'whop_user_2',
        tenantId: tenant.id,
        createdAt: new Date()
      }
    });

    const admin = await prisma.user.create({
      data: {
        id: 'admin_test',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        whopUserId: 'whop_admin',
        tenantId: tenant.id,
        createdAt: new Date()
      }
    });

    // Create test challenges
    const challenge1 = await prisma.challenge.create({
      data: {
        id: 'challenge_1',
        tenantId: tenant.id,
        title: '30-Day Fitness Challenge',
        description: 'Complete daily workout routines for 30 days straight!',
        rules: {
          type: 'daily',
          duration: 30,
          requirements: ['Take a workout photo', 'Complete minimum 30 minutes exercise']
        },
        proofType: 'PHOTO',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        imageUrl: '/uploads/fitness-challenge.jpg',
        whopProductId: 'prod_fitness_30d',
        whopCreatorId: 'creator_fitness_guru'
      }
    });

    const challenge2 = await prisma.challenge.create({
      data: {
        id: 'challenge_2',
        tenantId: tenant.id,
        title: 'Daily Reading Challenge',
        description: 'Read for at least 1 hour every day for 21 days.',
        rules: {
          type: 'daily',
          duration: 21,
          requirements: ['Take photo of book/page', 'Write brief summary']
        },
        proofType: 'PHOTO',
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // 22 days from now
        createdAt: new Date(),
        imageUrl: '/uploads/reading-challenge.jpg',
        whopProductId: 'prod_reading_21d',
        whopCreatorId: 'creator_book_lover'
      }
    });

    // Create enrollments
    const enrollment1 = await prisma.enrollment.create({
      data: {
        id: 'enrollment_1',
        userId: user1.id,
        challengeId: challenge1.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
        progress: 5, // 5 days completed
        isActive: true
      }
    });

    const enrollment2 = await prisma.enrollment.create({
      data: {
        id: 'enrollment_2',
        userId: user2.id,
        challengeId: challenge1.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
        progress: 3, // 3 days completed
        isActive: true
      }
    });

    // Create some proof submissions
    await prisma.proof.create({
      data: {
        id: 'proof_1',
        enrollmentId: enrollment1.id,
        userId: user1.id,
        challengeId: challenge1.id,
        day: 1,
        proofText: 'Completed 45 minutes of cardio and strength training!',
        imageUrl: '/uploads/workout-day1.jpg',
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        isActive: true,
        status: 'APPROVED'
      }
    });

    await prisma.proof.create({
      data: {
        id: 'proof_2',
        enrollmentId: enrollment1.id,
        userId: user1.id,
        challengeId: challenge1.id,
        day: 2,
        proofText: 'Morning run + yoga session. Feeling great!',
        imageUrl: '/uploads/workout-day2.jpg',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        isActive: true,
        status: 'APPROVED'
      }
    });

    console.log('✅ Test data created successfully!');
    console.log(`📊 Created:
    - 1 tenant
    - 3 users (2 regular + 1 admin)
    - 2 challenges 
    - 2 enrollments
    - 2 proof submissions
    `);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
