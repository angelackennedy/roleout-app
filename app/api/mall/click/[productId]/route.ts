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
    const context = searchParams.get('ref') || 'unknown';

    const { data: { user } } = await supabase.auth.getUser();

    const { data: product, error: productError } = await supabase
      .from('mall_products')
      .select('product_url, network, tracking_url')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const { error: rpcError } = await supabase.rpc('increment_product_clicks', {
      p_product_id: productId,
      p_user_id: user?.id || null,
      p_context: context,
    });

    if (rpcError) {
      console.error('Error calling increment_product_clicks RPC:', rpcError);
    }

    const redirectUrl = product.tracking_url || product.product_url;

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'No product URL available' },
        { status: 404 }
      );
    }

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to process click' },
      { status: 500 }
    );
  }
}
