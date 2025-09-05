import { NextRequest } from 'next/server';
import { ChallengeMeta } from '@/lib/discoverTypes';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.WHOP_APP_API_KEY;
    
    if (!apiKey) {
      return new Response('WHOP_APP_API_KEY not configured', { status: 500 });
    }

    const body = await request.json();
    const { id: experienceId } = await context.params;

    // Validate experience ID
    if (!experienceId || typeof experienceId !== 'string') {
      return new Response('Invalid experience ID', { status: 400 });
    }

    // Validate and sanitize metadata
    const metadata: Partial<ChallengeMeta> = {};
    
    if (typeof body.public === 'boolean') {
      metadata.public = body.public;
    }
    
    if (typeof body.title === 'string' && body.title.trim()) {
      metadata.title = body.title.trim();
    }
    
    if (typeof body.bannerUrl === 'string' && body.bannerUrl.trim()) {
      metadata.bannerUrl = body.bannerUrl.trim();
    }
    
    if (body.cadence === 'DAILY' || body.cadence === 'END') {
      metadata.cadence = body.cadence;
    }
    
    if (typeof body.planId === 'string' && body.planId.trim()) {
      metadata.planId = body.planId.trim();
    }
    
    if (typeof body.affiliateUsername === 'string' && body.affiliateUsername.trim()) {
      metadata.affiliateUsername = body.affiliateUsername.trim();
    }
    
    if (typeof body.promoUrl === 'string' && body.promoUrl.trim()) {
      metadata.promoUrl = body.promoUrl.trim();
    }

    console.log('Updating experience metadata:', { experienceId, metadata });

    // Update experience metadata via Whop API
    const response = await fetch(`https://api.whop.com/v5/app/experiences/${experienceId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whop experience update error:', errorText);
      return new Response(`Update error: ${errorText}`, { status: response.status });
    }

    const updatedExperience = await response.json();
    return Response.json({ 
      success: true, 
      experience: updatedExperience 
    });

  } catch (error) {
    console.error('Experience update error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
