import { NextRequest } from 'next/server';
import { WhopExperience, DiscoverCard } from '@/lib/discoverTypes';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.WHOP_APP_API_KEY;
    
    if (!apiKey) {
      return new Response('WHOP_APP_API_KEY not configured', { status: 500 });
    }

    // Fetch all experiences from Whop API
    const response = await fetch('https://api.whop.com/v5/app/experiences?per=50', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whop API error:', errorText);
      return new Response(`Whop API error: ${errorText}`, { status: response.status });
    }

    const data = await response.json();
    const experiences: WhopExperience[] = data.data || [];

    // Filter for public experiences and transform to DiscoverCard format
    const publicExperiences = experiences.filter(
      (exp: WhopExperience) => exp.metadata?.public === true
    );

    const discoverCards: DiscoverCard[] = publicExperiences.map((exp: WhopExperience) => ({
      id: exp.id,
      title: exp.metadata?.title || exp.name,
      bannerUrl: exp.metadata?.bannerUrl || undefined,
      planId: exp.metadata?.planId || undefined,
      affiliateUsername: exp.metadata?.affiliateUsername || undefined,
      promoUrl: exp.metadata?.promoUrl || undefined,
      communityName: exp.company?.name || undefined,
    }));

    return Response.json({ 
      items: discoverCards,
      total: discoverCards.length 
    });

  } catch (error) {
    console.error('Discover API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
