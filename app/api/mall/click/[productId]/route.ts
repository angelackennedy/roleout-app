import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = await createClient();
    const productId = params.productId;
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref');

    // Get user (may be null for logged-out users)
    const { data: { user } } = await supabase.auth.getUser();

    // Track click
    const { error: clickError } = await supabase
      .from('mall_clicks')
      .insert({
        product_id: productId,
        user_id: user?.id || null,
        ref: ref || null,
      });

    if (clickError) {
      console.error('Error tracking click:', clickError);
    }

    // Get product and affiliate info
    const { data: product } = await supabase
      .from('mall_products')
      .select('product_url')
      .eq('id', productId)
      .single();

    const { data: affiliate } = await supabase
      .from('mall_affiliates')
      .select('tracking_url')
      .eq('product_id', productId)
      .single();

    // Redirect to affiliate tracking URL if exists, otherwise product URL
    const redirectUrl = affiliate?.tracking_url || product?.product_url;

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'Product not found or no URL available' },
        { status: 404 }
      );
    }

    // Return 302 redirect
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to process click' },
      { status: 500 }
    );
  }
}
