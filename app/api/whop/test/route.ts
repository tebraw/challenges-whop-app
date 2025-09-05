// app/api/whop/test/route.ts - Test Real Whop Integration
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test Whop API connection with your real credentials
    const testResults = {
      timestamp: new Date().toISOString(),
      credentials: {
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ? '✅ Set' : '❌ Missing',
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID ? '✅ Set' : '❌ Missing',
        agentUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID ? '✅ Set' : '❌ Missing',
        apiKey: process.env.WHOP_API_KEY ? '✅ Set' : '❌ Missing'
      },
      apiTests: {}
    };

    // Test 1: Fetch company information
    try {
      const companyResponse = await fetch(`https://api.whop.com/v5/companies/${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID!
        }
      });

      if (companyResponse.ok) {
        const company = await companyResponse.json();
        testResults.apiTests = {
          ...testResults.apiTests,
          companyInfo: {
            status: '✅ Success',
            name: company.name,
            id: company.id,
            verified: company.verified ? '✅ Verified' : '⚠️ Not Verified'
          }
        };
      } else {
        const errorText = await companyResponse.text();
        testResults.apiTests = {
          ...testResults.apiTests,
          companyInfo: {
            status: '❌ Failed',
            error: `${companyResponse.status}: ${errorText}`,
            statusCode: companyResponse.status
          }
        };
      }
    } catch (error) {
      testResults.apiTests = {
        ...testResults.apiTests,
        companyInfo: {
          status: '❌ Error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }

    // Test 2: List company products/plans
    try {
      const productsResponse = await fetch(`https://api.whop.com/v5/products?company_id=${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID!
        }
      });

      if (productsResponse.ok) {
        const products = await productsResponse.json();
        testResults.apiTests = {
          ...testResults.apiTests,
          products: {
            status: '✅ Success',
            count: products.data?.length || 0,
            products: products.data?.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              status: p.status
            })) || []
          }
        };
      } else {
        const errorText = await productsResponse.text();
        testResults.apiTests = {
          ...testResults.apiTests,
          products: {
            status: '❌ Failed',
            error: `${productsResponse.status}: ${errorText}`
          }
        };
      }
    } catch (error) {
      testResults.apiTests = {
        ...testResults.apiTests,
        products: {
          status: '❌ Error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }

    // Test 3: Check if agent user exists
    try {
      const userResponse = await fetch(`https://api.whop.com/v5/users/${process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Whop-App-Id': process.env.NEXT_PUBLIC_WHOP_APP_ID!
        }
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        testResults.apiTests = {
          ...testResults.apiTests,
          agentUser: {
            status: '✅ Success',
            id: user.id,
            username: user.username,
            email: user.email
          }
        };
      } else {
        const errorText = await userResponse.text();
        testResults.apiTests = {
          ...testResults.apiTests,
          agentUser: {
            status: '❌ Failed',
            error: `${userResponse.status}: ${errorText}`
          }
        };
      }
    } catch (error) {
      testResults.apiTests = {
        ...testResults.apiTests,
        agentUser: {
          status: '❌ Error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('Whop test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Whop integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
