import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('algorithm_weights')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({ weights: data });
  } catch (error) {
    console.error('Error fetching algorithm weights:', error);
    return NextResponse.json({ 
      weights: {
        likes_weight: 0.4,
        comments_weight: 0.4,
        watch_completion_weight: 0.2,
        updated_at: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseServer = await createClient();
    
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in to update algorithm weights' },
        { status: 401 }
      );
    }

    const { likes_weight, comments_weight, watch_completion_weight } = await request.json();

    const total = likes_weight + comments_weight + watch_completion_weight;
    if (Math.abs(total - 1.0) > 0.01) {
      return NextResponse.json(
        { error: 'Weights must sum to 1.0' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('algorithm_weights')
      .insert({
        likes_weight,
        comments_weight,
        watch_completion_weight,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ weights: data });
  } catch (error) {
    console.error('Error updating algorithm weights:', error);
    return NextResponse.json({ error: 'Failed to update weights' }, { status: 500 });
  }
}
