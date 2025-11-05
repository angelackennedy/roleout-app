import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
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
    const { productId, title, description, price, productUrl, imageUrl } = body;

    if (!productId || !title || !price) {
      return NextResponse.json(
        { error: 'Product ID, title, and price are required' },
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

    const { data: product, error: updateError } = await supabase
      .from('mall_products')
      .update({
        title,
        description: description || null,
        price,
        product_url: productUrl || null,
        image_url: imageUrl || null,
      })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Update product API error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
