// app/api/whop/categories/route.ts
import { NextResponse } from 'next/server';
import { getWhopCategories, syncWhopCategories } from '@/lib/whopApi';

export async function GET() {
  try {
    const categories = await getWhopCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching Whop categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const categories = await syncWhopCategories();
    return NextResponse.json({ 
      message: 'Categories synced successfully',
      count: categories.length,
      categories 
    });
  } catch (error) {
    console.error('Error syncing Whop categories:', error);
    return NextResponse.json(
      { error: 'Failed to sync categories' }, 
      { status: 500 }
    );
  }
}
