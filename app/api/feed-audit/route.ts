import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.audits && Array.isArray(body.audits)) {
      const { error } = await supabase
        .from('feed_audit')
        .insert(body.audits);

      if (error) throw error;
    } else {
      const { user_id, post_id, rank_reason, score } = body;
      const { error } = await supabase
        .from('feed_audit')
        .insert({
          user_id,
          post_id,
          rank_reason,
          score
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging feed audit:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
