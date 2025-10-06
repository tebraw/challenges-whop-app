import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Checking environment variables...');
    
    const envCheck = {
      hasWhopApiKey: !!process.env.WHOP_API_KEY,
      hasWhopAppId: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
      hasWebhookSecret: !!process.env.WHOP_WEBHOOK_SECRET,
      whopApiKeyLength: process.env.WHOP_API_KEY?.length || 0,
      whopAppId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('📋 Environment check:', envCheck);
    
    // Manueller API Test mit fetch
    const apiKey = process.env.WHOP_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'WHOP_API_KEY not found',
        envCheck
      });
    }
    
    // Test API Call direkt mit fetch
    console.log('🔗 Testing direct API call...');
    
    const testUrl = 'https://api.whop.com/api/v2/me';
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const apiTestResult = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    };
    
    let responseData = null;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    console.log('📊 API Test result:', apiTestResult);
    console.log('📄 API Response:', responseData);
    
    return NextResponse.json({
      success: response.ok,
      envCheck,
      apiTest: {
        ...apiTestResult,
        response: responseData
      },
      recommendation: response.ok 
        ? '✅ API Key works! Try to find Ledger Account ID in Whop Dashboard manually.'
        : '❌ API Key invalid. Check permissions: company:balance:read, payout:transfer_funds'
    });
    
  } catch (error) {
    console.error('💥 API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      recommendation: 'Check your API key and network connection'
    }, { status: 500 });
  }
}