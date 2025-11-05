import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, network, trackingUrl } = body;

    if (!productId || !network || !trackingUrl) {
      return NextResponse.json(
        { error: 'Product ID, network, and tracking URL are required' },
        { status: 400 }
      );
    }

    const { data: existingProduct } = await supabase
      .from('mall_products')
      .select('creator_id')
      .eq('id', productId)
      .single();

    if (!existingProduct || existingProduct.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from('mall_affiliates')
      .select('id')
      .eq('product_id', productId)
      .single();

    let affiliate;
    if (existing) {
      const { data, error } = await supabase
        .from('mall_affiliates')
        .update({ network, tracking_url: trackingUrl })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      affiliate = data;
    } else {
      const { data, error } = await supabase
        .from('mall_affiliates')
        .insert({ product_id: productId, network, tracking_url: trackingUrl })
        .select()
        .single();
      
      if (error) throw error;
      affiliate = data;
    }

    await supabase
      .from('mall_products')
      .update({ network, tracking_url: trackingUrl })
      .eq('id', productId);

    return NextResponse.json({ affiliate });
  } catch (error) {
    console.error('Set affiliate API error:', error);
    return NextResponse.json(
      { error: 'Failed to set affiliate' },
      { status: 500 }
    );
  }
}
