// Database verification script for Experience-based isolation
const { PrismaClient } = require('@prisma/client');

async function verifyDatabaseStructure() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying Database Structure for Experience Isolation...\n');

    // Check if experienceId fields exist
    console.log('📋 1. Checking Challenge model structure...');
    const challengeFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Challenge' 
      AND column_name IN ('experienceId', 'whopCompanyId', 'tenantId')
      ORDER BY column_name;
    `;
    
    console.log('Challenge fields:', challengeFields);

    console.log('\n📋 2. Checking User model structure...');
    const userFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('experienceId', 'whopCompanyId', 'tenantId')
      ORDER BY column_name;
    `;
    
    console.log('User fields:', userFields);

    console.log('\n📋 3. Checking indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('Challenge', 'User') 
      AND indexdef LIKE '%experienceId%'
      ORDER BY tablename, indexname;
    `;
    
    console.log('Experience ID indexes:', indexes);

    console.log('\n📊 4. Checking current data distribution...');
    
    // Count challenges by experienceId
    const challengeStats = await prisma.$queryRaw`
      SELECT 
        "experienceId",
        "whopCompanyId",
        COUNT(*) as challenge_count
      FROM "Challenge" 
      GROUP BY "experienceId", "whopCompanyId"
      ORDER BY challenge_count DESC;
    `;
    
    console.log('Challenge distribution:');
    challengeStats.forEach(stat => {
      console.log(`  Experience: ${stat.experienceId || 'NULL'}, Company: ${stat.whopCompanyId || 'NULL'}, Challenges: ${stat.challenge_count}`);
    });

    // Count users by experienceId
    const userStats = await prisma.$queryRaw`
      SELECT 
        "experienceId",
        "whopCompanyId", 
        COUNT(*) as user_count
      FROM "User" 
      GROUP BY "experienceId", "whopCompanyId"
      ORDER BY user_count DESC;
    `;
    
    console.log('\nUser distribution:');
    userStats.forEach(stat => {
      console.log(`  Experience: ${stat.experienceId || 'NULL'}, Company: ${stat.whopCompanyId || 'NULL'}, Users: ${stat.user_count}`);
    });

    console.log('\n✅ Database verification complete!');
    
    // Summary
    const hasExperienceIdInChallenges = challengeFields.some(field => field.column_name === 'experienceId');
    const hasExperienceIdInUsers = userFields.some(field => field.column_name === 'experienceId');
    const hasIndexes = indexes.length > 0;
    
    console.log('\n🎯 Summary:');
    console.log(`✅ Challenge.experienceId field: ${hasExperienceIdInChallenges ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ User.experienceId field: ${hasExperienceIdInUsers ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ Experience ID indexes: ${hasIndexes ? 'EXISTS' : 'MISSING'}`);
    
    if (hasExperienceIdInChallenges && hasExperienceIdInUsers) {
      console.log('\n🎉 Database is READY for Experience-based isolation!');
    } else {
      console.log('\n❌ Database needs migration for Experience-based isolation!');
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseStructure();