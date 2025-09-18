// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCreatorProducts } from '@/lib/whopApi';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

// GET /api/admin/products - Get creator's products
export async function GET(request: NextRequest) {
      try {
    // SICHERHEIT: Nur Admins können Produkte verwalten
    await requireAdmin();
    const user = await getCurrentUser();

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Get products from local database
    const localProducts = await prisma.whopProduct.findMany({
      where: {
        creatorId: creatorId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no local products, sync from Whop
    if (localProducts.length === 0) {
      const whopProducts = await getCreatorProducts(creatorId);
      
      // SKIP DATABASE SYNC - WhopProduct foreign key constraint issue
      // Direct return from Whop API instead of local database storage
      console.log('📝 WhopProduct database sync SKIPPED - using direct Whop API response');
      console.log(`🔍 Found ${whopProducts.length} products from Whop API`);
      
      // Convert Whop API format to expected format without database storage
      const convertedProducts = whopProducts.map(product => ({
        id: product.id, // Use Whop ID directly
        whopProductId: product.id,
        name: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        productType: product.product_type,
        imageUrl: product.image_url,
        checkoutUrl: product.checkout_url,
        creatorId: creatorId,
        whopCreatorId: product.creator_id,
        isActive: true
      }));

      return NextResponse.json({ products: convertedProducts });
    }

    return NextResponse.json({ products: localProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products/sync - Sync products from Whop
export async function POST(request: NextRequest) {
      try {
    const { creatorId, whopCreatorId } = await request.json();

    if (!creatorId || !whopCreatorId) {
      return NextResponse.json(
        { error: 'Creator ID and Whop Creator ID are required' },
        { status: 400 }
      );
    }

    // Fetch products from Whop API (skip database sync - foreign key constraint issue)
    const whopProducts = await getCreatorProducts(whopCreatorId);

    // SKIP database sync - return direct API response converted to expected format
    console.log('📝 WhopProduct database sync SKIPPED - foreign key constraint issue');
    console.log(`🔍 Returning ${whopProducts.length} products directly from Whop API`);
    
    // Convert Whop API response to expected format without database storage
    const convertedProducts = whopProducts.map(product => ({
      id: `whop_${product.id}`, // Create virtual ID
      whopProductId: product.id,
      name: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      productType: product.product_type,
      imageUrl: product.image_url,
      checkoutUrl: product.checkout_url,
      isActive: product.is_active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    return NextResponse.json({ 
      message: `Retrieved ${convertedProducts.length} products from Whop API (database sync skipped)`,
      products: convertedProducts
    });
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    );
  }
}
