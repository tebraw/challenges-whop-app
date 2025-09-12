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
      
      // Sync to local database
      for (const product of whopProducts) {
        await prisma.whopProduct.create({
          data: {
            whopProductId: product.id,
            name: product.title,
            description: product.description,
            price: product.price,
            currency: product.currency,
            productType: product.product_type,
            imageUrl: product.image_url,
            checkoutUrl: product.checkout_url,
            creatorId: creatorId,
            whopCreatorId: product.creator_id
          }
        });
      }

      // Fetch updated local products
      const syncedProducts = await prisma.whopProduct.findMany({
        where: {
          creatorId: creatorId,
          isActive: true
        }
      });

      return NextResponse.json({ products: syncedProducts });
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

    // Fetch products from Whop API
    const whopProducts = await getCreatorProducts(whopCreatorId);

    // Update local database
    const syncResults = [];
    for (const product of whopProducts) {
      const syncedProduct = await prisma.whopProduct.upsert({
        where: {
          whopProductId: product.id
        },
        update: {
          name: product.title,
          description: product.description,
          price: product.price,
          currency: product.currency,
          productType: product.product_type,
          imageUrl: product.image_url,
          checkoutUrl: product.checkout_url,
          isActive: product.is_active
        },
        create: {
          whopProductId: product.id,
          name: product.title,
          description: product.description,
          price: product.price,
          currency: product.currency,
          productType: product.product_type,
          imageUrl: product.image_url,
          checkoutUrl: product.checkout_url,
          creatorId: creatorId,
          whopCreatorId: whopCreatorId
        }
      });
      syncResults.push(syncedProduct);
    }

    return NextResponse.json({ 
      message: `Synced ${syncResults.length} products`,
      products: syncResults
    });
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    );
  }
}
