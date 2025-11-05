import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('algorithm_changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ changelog: data || [] });
  } catch (error) {
    console.error('Error fetching algorithm changelog:', error);
    return NextResponse.json({ changelog: [] }, { status: 500 });
  }
}
