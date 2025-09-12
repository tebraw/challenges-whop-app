console.log('🧪 SIMULATING: User creation with experience exp_9igIIxfCLFakDh\n');

// This simulates the exact scenario your colleague hit
const mockExperienceContext = {
  userId: 'user_w3lVukX5x9ayO',
  companyId: null, // Simulate no company ID from headers
  experienceId: 'exp_9igIIxfCLFakDh' // The actual experience ID your colleague got
};

console.log('📋 SIMULATION INPUT:');
console.log('   User ID:', mockExperienceContext.userId);
console.log('   Company ID:', mockExperienceContext.companyId || 'NULL');
console.log('   Experience ID:', mockExperienceContext.experienceId);
console.log();

// Trace through the lib/auth.ts logic
console.log('🔍 TRACING lib/auth.ts logic:');
console.log();

// Step 1: Experience context extraction
let userCompanyId = mockExperienceContext.companyId;
console.log('Step 1 - Initial company ID:', userCompanyId || 'NULL');

// Step 2: Automatic extraction logic (Line 278-282 in lib/auth.ts)
if (!userCompanyId && mockExperienceContext.experienceId) {
  userCompanyId = `biz_${mockExperienceContext.experienceId.replace('exp_', '')}`;
  console.log('Step 2 - Extracted company ID:', userCompanyId);
} else {
  console.log('Step 2 - No extraction needed');
}

// Step 3: Error check (Line 284-287 in lib/auth.ts)
if (!userCompanyId) {
  console.log('Step 3 - FATAL ERROR: No company ID determined');
} else {
  console.log('Step 3 - Company ID valid:', userCompanyId);
}

console.log();
console.log('🎯 EXPECTED RESULT:');
console.log('   User should get company ID:', userCompanyId);
console.log('   But actual user got company ID: 9nmw5yleoqldrxf7n48c');
console.log();

console.log('❌ CONCLUSION:');
console.log('   There is a DIFFERENT code path being used!');
console.log('   The lib/auth.ts Experience App logic is NOT being executed.');
console.log('   Your colleague must be hitting a different authentication method.');
console.log();

console.log('🔍 LIKELY CULPRITS:');
console.log('   1. lib/whop-auth.ts (Legacy Whop headers fallback)');
console.log('   2. Dashboard Access path instead of Experience App path');
console.log('   3. OAuth session path');
console.log('   4. Some other authentication code we missed');

// Let's check what the fallback value "9nmw5yleoqldrxf7n48c" could be
console.log();
console.log('🚨 MYSTERY OF THE FALLBACK VALUE:');
console.log('   Value: 9nmw5yleoqldrxf7n48c');
console.log('   Length:', '9nmw5yleoqldrxf7n48c'.length, 'characters');
console.log('   Pattern: Looks like a Whop company ID');
console.log('   Source: Must be hardcoded SOMEWHERE in the codebase');
console.log();
console.log('💡 NEXT STEPS:');
console.log('   1. Search for any remaining instances of this exact string');
console.log('   2. Check which authentication path your colleague actually used');
console.log('   3. Trace the exact request flow that created this user');