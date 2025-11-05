import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all products for this creator
    const { data: products, error: productsError } = await supabase
      .from('mall_products')
      .select('id, title, price, sales')
      .eq('creator_id', user.id);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        totalClicks: 0,
        totalSales: 0,
        totalRevenue: 0,
        productsCount: 0,
        topProducts: [],
      });
    }

    const productIds = products.map(p => p.id);

    // Get click counts and last click for each product
    const { data: clicksData, error: clicksError } = await supabase
      .from('mall_clicks')
      .select('product_id, clicked_at')
      .in('product_id', productIds)
      .order('clicked_at', { ascending: false });

    if (clicksError) {
      console.error('Error fetching clicks:', clicksError);
    }

    // Aggregate clicks by product
    const productClicksMap = new Map<string, { count: number; last_click: string | null }>();
    
    (clicksData || []).forEach(click => {
      const current = productClicksMap.get(click.product_id) || { count: 0, last_click: null };
      current.count++;
      if (!current.last_click || click.clicked_at > current.last_click) {
        current.last_click = click.clicked_at;
      }
      productClicksMap.set(click.product_id, current);
    });

    // Calculate total clicks
    const totalClicks = (clicksData || []).length;

    // Calculate total sales and revenue
    const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.sales || 0)), 0);

    // Get top 5 products by clicks
    const topProducts = products
      .map(p => ({
        id: p.id,
        title: p.title,
        clicks: productClicksMap.get(p.id)?.count || 0,
        last_click_at: productClicksMap.get(p.id)?.last_click || null,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    return NextResponse.json({
      totalClicks,
      totalSales,
      totalRevenue,
      productsCount: products.length,
      topProducts,
    });
  } catch (error) {
    console.error('Mall stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to load mall stats' },
      { status: 500 }
    );
  }
}
