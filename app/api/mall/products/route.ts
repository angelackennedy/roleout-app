import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: productsData, error: productsError } = await supabase
      .from('mall_products')
      .select(`
        *,
        creator:profiles!creator_id(username, avatar_url),
        post:posts!post_id(video_url, image_url)
      `)
      .order('clicks', { ascending: false })
      .order('sales', { ascending: false })
      .order('views', { ascending: false })
      .limit(100);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const products = (productsData || []).map((product: any) => ({
      ...product,
      creator_username: product.creator?.username,
      creator_avatar: product.creator?.avatar_url,
      post_video_url: product.post?.video_url,
      post_image_url: product.post?.image_url,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Mall products API error:', error);
    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 }
    );
  }
}
