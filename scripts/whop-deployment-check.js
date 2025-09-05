#!/usr/bin/env node

/**
 * Whop Deployment Preparation Script
 * This script helps prepare your app for Whop deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Whop App for Deployment...\n');

// Check if running in correct directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from your project root directory');
  process.exit(1);
}

// Check environment files
function checkEnvironmentSetup() {
  console.log('📋 Checking Environment Setup...');
  
  const envFiles = ['.env.local', '.env.whop.production'];
  const foundEnvFiles = envFiles.filter(file => fs.existsSync(file));
  
  if (foundEnvFiles.length === 0) {
    console.warn('⚠️  No environment files found');
    console.log('   Please copy .env.whop.production to .env.local and configure your Whop credentials');
  } else {
    console.log(`✅ Found environment files: ${foundEnvFiles.join(', ')}`);
  }
  
  // Check for required Whop environment variables
  const requiredVars = [
    'WHOP_APP_ID',
    'WHOP_API_KEY', 
    'WHOP_CLIENT_SECRET',
    'WHOP_WEBHOOK_SECRET'
  ];
  
  console.log('\n📋 Required Environment Variables:');
  requiredVars.forEach(varName => {
    const hasVar = process.env[varName];
    const status = hasVar ? '✅' : '❌';
    console.log(`   ${status} ${varName}`);
  });
}

// Check Whop app structure
function checkWhopStructure() {
  console.log('\n📋 Checking Whop App Structure...');
  
  const requiredViews = [
    'app/dashboard/page.tsx',
    'app/discover/page.tsx', 
    'app/experience/[id]/page.tsx'
  ];
  
  const requiredApi = [
    'app/api/whop/webhook/route.ts',
    'app/api/auth/whop/status/route.ts',
    'app/api/auth/whop/callback/route.ts'
  ];
  
  console.log('   Views:');
  requiredViews.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`     ${status} ${file}`);
  });
  
  console.log('   API Routes:');
  requiredApi.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`     ${status} ${file}`);
  });
}

// Check SDK implementation
function checkSDKImplementation() {
  console.log('\n📋 Checking Whop SDK Implementation...');
  
  const sdkFile = 'lib/whop-sdk.ts';
  const authFile = 'lib/whop-auth.ts';
  
  if (fs.existsSync(sdkFile)) {
    const sdkContent = fs.readFileSync(sdkFile, 'utf8');
    const hasRealImplementation = sdkContent.includes('class WhopSDK');
    const status = hasRealImplementation ? '✅' : '⚠️';
    console.log(`   ${status} ${sdkFile} - ${hasRealImplementation ? 'Real implementation' : 'Placeholder implementation'}`);
  } else {
    console.log(`   ❌ ${sdkFile} - Missing`);
  }
  
  if (fs.existsSync(authFile)) {
    console.log(`   ✅ ${authFile} - Present`);
  } else {
    console.log(`   ❌ ${authFile} - Missing`);
  }
}

// Generate deployment checklist
function generateDeploymentChecklist() {
  console.log('\n📋 Deployment Checklist:');
  
  const checklist = [
    'Create Whop App in Creator Dashboard (https://dev.whop.com/apps)',
    'Configure App URLs in Whop Dashboard',
    'Copy App ID, API Key, Client Secret, and Webhook Secret',
    'Update .env.local with real Whop credentials',
    'Test authentication flow locally',
    'Deploy to production (Vercel/hosting platform)',
    'Update Whop app URLs to production URLs',
    'Test webhook endpoint',
    'Test complete user flow',
    'Submit app for Whop review'
  ];
  
  checklist.forEach((item, index) => {
    console.log(`   ${index + 1}. □ ${item}`);
  });
}

// Check package.json for required dependencies
function checkDependencies() {
  console.log('\n📋 Checking Dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@prisma/client',
    'next',
    'react',
    'lucide-react'
  ];
  
  requiredDeps.forEach(dep => {
    const haseDep = deps[dep];
    const status = haseDep ? '✅' : '❌';
    console.log(`   ${status} ${dep} ${haseDep ? `(${haseDep})` : ''}`);
  });
}

// Main execution
function main() {
  checkEnvironmentSetup();
  checkWhopStructure();
  checkSDKImplementation();
  checkDependencies();
  generateDeploymentChecklist();
  
  console.log('\n🎉 Whop App Deployment Check Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Complete the deployment checklist above');
  console.log('   2. Configure your Whop credentials in .env.local');
  console.log('   3. Test locally with: pnpm dev');
  console.log('   4. Deploy to production');
  console.log('   5. Test your Whop app integration\n');
}

main();
