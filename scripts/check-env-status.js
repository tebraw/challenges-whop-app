#!/usr/bin/env node

/**
 * Vercel Environment Check
 * Compares what's set vs what's needed
 */

const currentVars = [
  'POSTGRES_URL',
  'PRISMA_DATABASE_URL', 
  'WHOP_API_KEY',
  'NEXT_PUBLIC_WHOP_APP_ID',
  'NEXT_PUBLIC_WHOP_AGENT_USER_ID',
  'NEXT_PUBLIC_WHOP_COMPANY_ID',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NODE_ENV',
  'ENABLE_DEV_AUTH'
];

const requiredVars = [
  'DATABASE_URL', // Missing! (but you have POSTGRES_URL)
  'DIRECT_URL',   // Missing! (but you have POSTGRES_URL) 
  'WHOP_APP_ID',  // Missing! (but you have NEXT_PUBLIC_WHOP_APP_ID)
  'WHOP_API_KEY', // ✅ Set
  'NEXTAUTH_SECRET', // ✅ Set
  'NEXTAUTH_URL',    // ✅ Set
  'NEXT_PUBLIC_WHOP_APP_ID', // ✅ Set
  'NODE_ENV', // ✅ Set
  'ENABLE_DEV_AUTH' // ✅ Set
];

console.log('🔍 Vercel Environment Variables Status\n');

console.log('✅ Already Set:');
currentVars.forEach(v => console.log(`  - ${v}`));

console.log('\n⚠️  Potentially Missing (but may have alternatives):');
console.log('  - DATABASE_URL (you have POSTGRES_URL)');
console.log('  - DIRECT_URL (you have POSTGRES_URL)'); 
console.log('  - WHOP_APP_ID (you have NEXT_PUBLIC_WHOP_APP_ID)');

console.log('\n🎯 Quick Fix Options:');
console.log('1. Add missing variables (recommended):');
console.log('   DATABASE_URL = same as POSTGRES_URL');
console.log('   DIRECT_URL = same as POSTGRES_URL'); 
console.log('   WHOP_APP_ID = same as NEXT_PUBLIC_WHOP_APP_ID');

console.log('\n2. Or test current setup first:');
console.log('   Your app might work with current variables!');

console.log('\n🚀 Next step: Test your deployed app:');
console.log('   https://challenges-whop-app-sqmr.vercel.app');
