// check-experience-headers.js
// Check if we can get company info from Experience headers

require('dotenv').config();

async function checkExperienceHeaders() {
  console.log('🔍 CHECKING: Experience Headers for Company Info...\n');

  // Simulate a request with Experience headers (like from iframe)
  const mockHeaders = {
    'x-whop-company-id': process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
    'x-whop-app-id': process.env.NEXT_PUBLIC_WHOP_APP_ID,
    'x-whop-experience-id': 'exp_' + process.env.NEXT_PUBLIC_WHOP_APP_ID,
    'x-whop-user-id': 'user_example_123'
  };

  console.log('📋 Experience Headers we might receive:');
  Object.entries(mockHeaders).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('\n🎯 COMPANY DETECTION STRATEGY:');
  console.log('='.repeat(50));
  
  // Strategy 1: Company ID from Headers
  if (mockHeaders['x-whop-company-id']) {
    console.log('✅ FOUND: Company ID in headers!');
    console.log(`   Company ID: ${mockHeaders['x-whop-company-id']}`);
    
    // We can create a mapping of known companies
    const knownCompanies = {
      'biz_YoIIIT73rXwrtK': 'Your Company Name',
      // Add more as needed
    };
    
    const companyName = knownCompanies[mockHeaders['x-whop-company-id']] || 'Unknown Company';
    console.log(`   Company Name: ${companyName}`);
  }

  // Strategy 2: User Input Approach
  console.log('\n💡 ALTERNATIVE: User Input Company Name');
  console.log('='.repeat(50));
  console.log('✅ Let users enter their company name on first login');
  console.log('✅ Store it with their profile');
  console.log('✅ Use it for tenant creation');

  // Strategy 3: Smart Username/Email extraction
  console.log('\n🧠 SMART EXTRACTION: From Username/Email');
  console.log('='.repeat(50));
  
  const exampleUsers = [
    { email: 'john@acme-corp.com', username: 'john_acme' },
    { email: 'sarah@tech-startup.io', username: 'sarah_tech' },
    { email: 'mike@creative-agency.com', username: 'mike_creative' }
  ];

  exampleUsers.forEach(user => {
    const emailDomain = user.email.split('@')[1];
    const companyFromEmail = emailDomain.split('.')[0].replace('-', ' ').replace('_', ' ');
    const companyFromUsername = user.username.split('_').slice(1).join(' ');
    
    console.log(`📧 ${user.email}`);
    console.log(`   From email: "${companyFromEmail}"`);
    console.log(`   From username: "${companyFromUsername}"`);
    console.log(`   Smart choice: "${companyFromEmail || companyFromUsername || user.username + "'s Company"}"`);
    console.log('');
  });

  console.log('🎯 RECOMMENDED SOLUTION:');
  console.log('='.repeat(50));
  console.log('1️⃣ Check if Experience provides company_id in headers');
  console.log('2️⃣ If available, use it for tenant creation');
  console.log('3️⃣ If not, use smart extraction from email/username');
  console.log('4️⃣ Fallback: Let user input company name');
  console.log('5️⃣ Always ensure unique company ID per user');
  
  console.log('\n✅ This approach is:');
  console.log('• API-independent (no external API calls needed)');
  console.log('• User-friendly (recognizable company names)');
  console.log('• Secure (still unique isolation per user)');
  console.log('• Scalable (works for unlimited users)');
}

checkExperienceHeaders().catch(console.error);