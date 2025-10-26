import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Looking for Ledger Account...');
    
    // Method 1: Try to get from your main company
    // Replace with your actual company ID if you know it
    const companyIds = [
      'biz_YoIIIT73rXwrtK', // From your logs
      'biz_9nmw5yleoqldrxf7n48c' // Alternative from logs
    ];
    
    const results = [];
    
    for (const companyId of companyIds) {
      try {
        console.log(`🏢 Checking company: ${companyId}`);
        
        const ledgerResult = await whopSdk.companies.getCompanyLedgerAccount({
          companyId: companyId
        });
        
        if (ledgerResult?.ledgerAccount?.id) {
          results.push({
            companyId,
            ledgerAccountId: ledgerResult.ledgerAccount.id,
            transferFee: ledgerResult.ledgerAccount.transferFee,
            balances: ledgerResult.ledgerAccount.balanceCaches?.nodes || []
          });
          
          console.log(`✅ Found Ledger Account: ${ledgerResult.ledgerAccount.id}`);
        }
      } catch (error) {
        console.log(`❌ Error for company ${companyId}:`, error);
        results.push({
          companyId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Method 2: Try to get from current app context
    try {
      console.log('🔍 Checking app context...');
      
      // Get app info
      const appInfo = {
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
        hasApiKey: !!process.env.WHOP_API_KEY
      };
      
      results.push({
        method: 'app_context',
        appInfo
      });
    } catch (error) {
      console.log('❌ App context error:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ledger Account Search Results',
      results,
      instructions: {
        found_ledger: results.find(r => r.ledgerAccountId),
        next_steps: results.find(r => r.ledgerAccountId) 
          ? `Add this to your .env.local: WHOP_LEDGER_ACCOUNT_ID=${results.find(r => r.ledgerAccountId)?.ledgerAccountId}`
          : 'No ledger account found. You may need to create one in Whop Dashboard → Settings → Payouts'
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Ledger Account search failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      suggestion: 'Check your WHOP_API_KEY and permissions (company:balance:read required)',
      troubleshooting: {
        check_env_vars: {
          app_id: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
          api_key: !!process.env.WHOP_API_KEY,
          webhook_secret: !!process.env.WHOP_WEBHOOK_SECRET
        },
        required_permissions: [
          'company:balance:read',
          'payout:transfer_funds'
        ]
      }
    }, { status: 500 });
  }
}
