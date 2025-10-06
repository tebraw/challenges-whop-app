import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET() {
  try {
    console.log('🔍 Starting ledger account search...');
    
    // Teste verschiedene Company IDs aus deinen Logs
    const companyIds = [
      'biz_YoIIIT73rXwrtK', // Hauptcompany aus Logs
      'biz_9nmw5yleoqldrxf7n48c' // Alternative aus Logs
    ];
    
    let foundLedger = null;
    let searchResults = [];
    
    for (const companyId of companyIds) {
      try {
        console.log(`🏢 Testing company: ${companyId}`);
        
        const result = await whopSdk.companies.getCompanyLedgerAccount({
          companyId: companyId
        });
        
        if (result?.ledgerAccount?.id) {
          foundLedger = {
            companyId,
            ledgerAccountId: result.ledgerAccount.id,
            transferFee: result.ledgerAccount.transferFee || 0,
            success: true
          };
          
          searchResults.push(foundLedger);
          console.log(`✅ FOUND LEDGER: ${result.ledgerAccount.id}`);
          
          // Erste gefundene nehmen
          break;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`❌ Company ${companyId} failed: ${errorMsg}`);
        
        searchResults.push({
          companyId,
          error: errorMsg,
          success: false
        });
      }
    }
    
    // Fallback: Versuche über Experience ID
    if (!foundLedger) {
      try {
        console.log('🔄 Trying via experience lookup...');
        
        // Versuche eine Experience zu finden und dann die Company
        const experienceId = 'exp_SZEmgcXRsEPQ1x'; // Aus deinen Logs
        
        const experience = await whopSdk.experiences.getExperience({
          experienceId: experienceId
        });
        
        if (experience?.company?.id) {
          const companyId = experience.company.id;
          console.log(`🏢 Found company via experience: ${companyId}`);
          
          const ledgerResult = await whopSdk.companies.getCompanyLedgerAccount({
            companyId: companyId
          });
          
          if (ledgerResult?.ledgerAccount?.id) {
            foundLedger = {
              companyId,
              ledgerAccountId: ledgerResult.ledgerAccount.id,
              transferFee: ledgerResult.ledgerAccount.transferFee || 0,
              method: 'via_experience',
              success: true
            };
            
            searchResults.push(foundLedger);
            console.log(`✅ FOUND LEDGER VIA EXPERIENCE: ${ledgerResult.ledgerAccount.id}`);
          }
        }
      } catch (expError) {
        console.log('❌ Experience lookup failed:', expError);
        searchResults.push({
          method: 'experience_lookup',
          error: expError instanceof Error ? expError.message : String(expError),
          success: false
        });
      }
    }
    
    // Response zusammenstellen
    const response = {
      success: !!foundLedger,
      ledgerAccountId: foundLedger?.ledgerAccountId || null,
      companyId: foundLedger?.companyId || null,
      transferFee: foundLedger?.transferFee || null,
      searchResults,
      envVariable: foundLedger ? `WHOP_LEDGER_ACCOUNT_ID=${foundLedger.ledgerAccountId}` : null,
      nextSteps: foundLedger 
        ? `✅ Add to .env.local: WHOP_LEDGER_ACCOUNT_ID=${foundLedger.ledgerAccountId}`
        : '❌ No ledger account found. Check permissions or create one in Whop Dashboard.',
      troubleshooting: {
        hasApiKey: !!process.env.WHOP_API_KEY,
        hasAppId: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
        requiredPermissions: ['company:balance:read', 'payout:transfer_funds']
      }
    };
    
    console.log('📋 Final result:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response, { 
      status: foundLedger ? 200 : 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('💥 Complete failure:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      suggestion: 'Check your Whop API configuration and permissions',
      troubleshooting: {
        hasApiKey: !!process.env.WHOP_API_KEY,
        hasAppId: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    }, { status: 500 });
  }
}