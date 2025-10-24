/**
 * 🎯 PHASE 3 SETUP: Get Company Ledger Account ID
 * 
 * Run this script once to get your ledger account ID and transfer fee.
 * Then add WHOP_LEDGER_ACCOUNT_ID to your .env file.
 * 
 * Usage: node --loader ts-node/esm setup-ledger-account.ts
 * Or: tsx setup-ledger-account.ts
 */

import { whopSdk } from './lib/whop-sdk-unified';

async function setupLedgerAccount() {
  try {
    console.log('🔍 Fetching company ledger account information...\n');

    const companyId = process.env.WHOP_COMPANY_ID;
    
    if (!companyId) {
      console.error('❌ Error: WHOP_COMPANY_ID not found in environment variables');
      console.log('Please add WHOP_COMPANY_ID=biz_XXXXXXXX to your .env file');
      process.exit(1);
    }

    console.log(`📊 Company ID: ${companyId}`);

    // Get ledger account
    const result = await whopSdk.companies.getCompanyLedgerAccount({
      companyId: companyId
    });

    if (!result?.ledgerAccount) {
      console.error('❌ Error: Could not retrieve ledger account');
      console.log('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    const ledgerAccount = result.ledgerAccount;

    console.log('\n✅ Successfully retrieved ledger account information:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Ledger Account ID: ${ledgerAccount.id}`);
    console.log(`Transfer Fee: ${ledgerAccount.transferFee || 0}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show balances if available
    if (ledgerAccount.balanceCaches?.nodes && ledgerAccount.balanceCaches.nodes.length > 0) {
      console.log('💰 Current Balances:');
      ledgerAccount.balanceCaches.nodes.forEach((cache: any) => {
        if (!cache) return;
        console.log(`  - ${cache.currency.toUpperCase()}: $${(cache.balance / 100).toFixed(2)}`);
        if (cache.pendingBalance > 0) {
          console.log(`    (Pending: $${(cache.pendingBalance / 100).toFixed(2)})`);
        }
      });
      console.log('');
    }

    console.log('📝 Next Steps:');
    console.log('1. Add this to your .env file:');
    console.log(`   WHOP_LEDGER_ACCOUNT_ID=${ledgerAccount.id}`);
    console.log('');
    console.log('2. Restart your development server');
    console.log('');
    console.log('3. Revenue distribution will now work automatically! 🎉');
    console.log('');

    // Calculate example revenue split
    console.log('💡 Example Revenue Split (for $10 entry fee):');
    const exampleAmount = 10.00;
    const cardFee = exampleAmount * 0.027 + 0.30;
    const afterCardFees = exampleAmount - cardFee;
    const creatorShare = afterCardFees * 0.9;
    const platformShare = afterCardFees * 0.1;
    const transferFee = ledgerAccount.transferFee ? (creatorShare * (ledgerAccount.transferFee / 100)) : 0;
    
    console.log(`  User pays: $${exampleAmount.toFixed(2)}`);
    console.log(`  Card processing fee: -$${cardFee.toFixed(2)}`);
    console.log(`  Amount after fees: $${afterCardFees.toFixed(2)}`);
    console.log(`  Creator (90%): $${creatorShare.toFixed(2)}`);
    if (transferFee > 0) {
      console.log(`  Transfer fee (${ledgerAccount.transferFee}%): -$${transferFee.toFixed(2)}`);
      console.log(`  Creator receives: $${(creatorShare - transferFee).toFixed(2)}`);
    }
    console.log(`  Platform (10%): $${platformShare.toFixed(2)}`);
    if (transferFee > 0) {
      console.log(`  Platform total: $${(platformShare + transferFee).toFixed(2)}`);
    }
    console.log('');
    console.log('✨ Creator receives money in their Whop balance instantly!');
    console.log('   They can use it on Whop or withdraw to bank (they pay withdrawal fees).');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the setup
setupLedgerAccount();
