import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    const { postId, title, description, price, productUrl, imageUrl } = body;

    if (!postId || !title || !price) {
      return NextResponse.json(
        { error: 'Post ID, title, and price are required' },
        { status: 400 }
      );
    }

    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data: product, error: insertError } = await supabase
      .from('mall_products')
      .insert({
        post_id: postId,
        creator_id: user.id,
        title,
        description: description || null,
        price,
        product_url: productUrl || null,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding product:', insertError);
      return NextResponse.json(
        { error: 'Failed to add product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Add product API error:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}
