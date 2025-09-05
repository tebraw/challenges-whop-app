#!/usr/bin/env node

/**
 * Quick deployment script for Whop Challenge App
 * Automates the deployment process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function deployToProduction() {
  console.log('🚀 Starting Production Deployment...\n');

  // Step 1: Build check
  runCommand('npm run build', 'Building application');

  // Step 2: Environment check
  console.log('\n🔍 Checking environment configuration...');
  const envFiles = ['.env.local', '.env.production'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} found`);
    } else {
      console.log(`⚠️  ${file} not found`);
    }
  });

  // Step 3: Database check
  runCommand('npx prisma generate', 'Generating Prisma client');
  
  // Step 4: Vercel deployment
  console.log('\n🌐 Deploying to Vercel...');
  console.log('Please ensure you have:');
  console.log('  1. Connected your GitHub repository to Vercel');
  console.log('  2. Added all environment variables');
  console.log('  3. Configured your database connection');
  
  try {
    runCommand('vercel --prod', 'Deploying to production');
  } catch (error) {
    console.log('\n📝 Manual deployment steps:');
    console.log('  1. Go to https://vercel.com');
    console.log('  2. Import your repository');
    console.log('  3. Add environment variables');
    console.log('  4. Deploy');
  }

  console.log('\n🎉 Deployment process complete!');
  console.log('\n📋 Post-deployment checklist:');
  console.log('  □ Configure Whop webhooks');
  console.log('  □ Test authentication flow');
  console.log('  □ Verify database connection');
  console.log('  □ Test payment integration');
}

// Run deployment
if (require.main === module) {
  deployToProduction();
}

module.exports = { deployToProduction };
