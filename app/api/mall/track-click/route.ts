import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { data: product } = await supabase
      .from('mall_products')
      .select('clicks')
      .eq('id', productId)
      .single();

    if (product) {
      const { error: updateError } = await supabase
        .from('mall_products')
        .update({ clicks: product.clicks + 1 })
        .eq('id', productId);

      if (updateError) {
        console.error('Error tracking click:', updateError);
        return NextResponse.json(
          { error: 'Failed to track click' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track click API error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
