import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('post_metrics')
      .select('*')
      .order('fair_score', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ posts: data || [] });
  } catch (error) {
    console.error('Error fetching transparency posts:', error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}
