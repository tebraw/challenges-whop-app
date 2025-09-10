// app/api/admin/whop/revenue-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const {
      platform_fee_percentage = 10,
      revenue_sharing_enabled = true,
      transparent_disclosure = true,
      payment_terms = 'Monthly payouts on the 15th of each month'
    } = await req.json();

    // Store revenue sharing settings
    const settings = {
      platform_fee_percentage,
      revenue_sharing_enabled,
      transparent_disclosure,
      payment_terms,
      updated_at: new Date().toISOString()
    };

    // You can store this in your database or environment
    // For now, we'll just return the settings as confirmation
    
    console.log('Revenue sharing settings updated:', settings);

    return NextResponse.json({
      success: true,
      settings: settings,
      message: 'Revenue sharing settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating revenue settings:', error);
    return NextResponse.json(
      { error: 'Failed to update revenue settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    await requireAdmin();
    
    // Return current revenue sharing settings
    const settings = {
      platform_fee_percentage: 10,
      revenue_sharing_enabled: true,
      transparent_disclosure: true,
      payment_terms: 'Monthly payouts on the 15th of each month',
      subscription_tiers: [
        {
          id: 'starter',
          name: 'Starter',
          price: 19,
          currency: 'USD',
          features: [
            'Up to 3 active challenges',
            'Basic analytics',
            'Email support',
            '10% revenue share on special offers',
            'Free community integration'
          ]
        },
        {
          id: 'professional',
          name: 'Professional',
          price: 49,
          currency: 'USD',
          features: [
            'Up to 15 active challenges',
            'Advanced analytics & insights',
            'Priority support',
            '10% revenue share on special offers',
            'Premium features',
            'Custom branding options'
          ]
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 79,
          currency: 'USD',
          features: [
            'Unlimited challenges',
            'Full analytics suite',
            'Dedicated support manager',
            '10% revenue share on special offers',
            'White-label solution',
            'API access',
            'Custom integrations'
          ]
        }
      ]
    };

    return NextResponse.json({
      success: true,
      settings: settings
    });

  } catch (error) {
    console.error('Error fetching revenue settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue settings' },
      { status: 500 }
    );
  }
}
