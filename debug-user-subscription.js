// Debug script to check user subscription status after payment
const API_KEY = 'whop_oaLWdJ91aEbOHUdJWqMPSjnMRWP6KkZPdPsktUwqXgcqvWLQvF';
const COMPANY_ID = 'biz_9VJLKXzZJ2VeU';

async function debugUserSubscription() {
  try {
    console.log('🔍 Debugging user subscription status...\n');
    
    // Get all memberships for your company
    const response = await fetch(`https://api.whop.com/v5/memberships?company_id=${COMPANY_ID}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📊 All company memberships:');
    console.log('Total memberships:', data.data?.length || 0);
    
    if (data.data?.length > 0) {
      // Show recent memberships
      const recentMemberships = data.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      console.log('\n🆕 Recent memberships:');
      recentMemberships.forEach((membership, i) => {
        console.log(`\n${i + 1}. Membership ID: ${membership.id}`);
        console.log(`   User ID: ${membership.user?.id || 'N/A'}`);
        console.log(`   User Email: ${membership.user?.email || 'N/A'}`);
        console.log(`   Product ID: ${membership.product?.id || 'N/A'}`);
        console.log(`   Product Name: ${membership.product?.title || 'N/A'}`);
        console.log(`   Status: ${membership.status}`);
        console.log(`   Valid: ${membership.valid}`);
        console.log(`   Created: ${membership.created_at}`);
        console.log(`   Expires: ${membership.expires_at || 'Never'}`);
      });
      
      // Check for our specific product IDs
      const basicProductId = 'prod_YByUE3J5oT4Fq';
      const proProductId = 'prod_Tj4T1U7pVwtgb';
      
      const basicMembers = data.data.filter(m => m.product?.id === basicProductId);
      const proMembers = data.data.filter(m => m.product?.id === proProductId);
      
      console.log(`\n💰 Basic Plan (${basicProductId}) members: ${basicMembers.length}`);
      console.log(`🚀 Pro Plan (${proProductId}) members: ${proMembers.length}`);
      
      if (basicMembers.length > 0) {
        console.log('\n📋 Basic Plan Members:');
        basicMembers.forEach(m => {
          console.log(`- ${m.user?.email || 'N/A'} (${m.status}, valid: ${m.valid})`);
        });
      }
      
      if (proMembers.length > 0) {
        console.log('\n📋 Pro Plan Members:');
        proMembers.forEach(m => {
          console.log(`- ${m.user?.email || 'N/A'} (${m.status}, valid: ${m.valid})`);
        });
      }
    }

    // Also get all products to verify IDs
    const productsResponse = await fetch(`https://api.whop.com/v5/products?company_id=${COMPANY_ID}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      
      console.log('\n🎯 Your Products:');
      productsData.data?.forEach(product => {
        console.log(`- ${product.title}: ${product.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugUserSubscription();