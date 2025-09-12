#!/usr/bin/env node

/**
 * URGENT: Find where the colleague is getting fallback company ID from
 */

console.log('🚨 DEBUGGING WHY COLLEAGUE STILL GETS FALLBACK COMPANY ID\n');

// Check the environment variables that could be causing this
console.log('🔍 CHECKING ENVIRONMENT VARIABLES:');
console.log('NEXT_PUBLIC_WHOP_COMPANY_ID:', process.env.NEXT_PUBLIC_WHOP_COMPANY_ID);
console.log('WHOP_COMPANY_ID:', process.env.WHOP_COMPANY_ID);
console.log('NEXT_PUBLIC_WHOP_APP_ID:', process.env.NEXT_PUBLIC_WHOP_APP_ID);

// The fallback value
const fallbackValue = '9nmw5yleoqldrxf7n48c';
console.log('\n🚨 FALLBACK VALUE ANALYSIS:');
console.log('Value:', fallbackValue);
console.log('Length:', fallbackValue.length, 'characters');

// Check if this matches any environment variable
const envVars = [
  'NEXT_PUBLIC_WHOP_COMPANY_ID',
  'WHOP_COMPANY_ID', 
  'NEXT_PUBLIC_WHOP_APP_ID',
  'WHOP_APP_ID'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value === fallbackValue) {
    console.log(`❌ FOUND MATCH: ${envVar} = ${value}`);
  } else if (value) {
    console.log(`✅ ${envVar}: ${value} (different)`);
  } else {
    console.log(`⚪ ${envVar}: undefined`);
  }
});

console.log('\n💡 POSSIBLE CAUSES:');
console.log('1. Environment variable NEXT_PUBLIC_WHOP_COMPANY_ID still has fallback value');
console.log('2. Some auth endpoint is hardcoded to return fallback');
console.log('3. Client-side code is using cached/hardcoded value');
console.log('4. Middleware is setting wrong headers');

console.log('\n🔧 NEXT STEPS:');
console.log('1. Check if NEXT_PUBLIC_WHOP_COMPANY_ID needs to be updated');
console.log('2. Clear all caches and rebuild');
console.log('3. Check middleware.ts for hardcoded values');
console.log('4. Verify auth flow is using dynamic extraction');