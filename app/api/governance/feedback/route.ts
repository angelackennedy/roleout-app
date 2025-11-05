import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { user_id, fairness_score, comment } = await req.json();
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (fairness_score < 1 || fairness_score > 5) {
      return NextResponse.json({ error: 'Fairness score must be between 1 and 5' }, { status: 400 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentFeedback, error: checkError } = await supabase
      .from('governance_feedback')
      .select('id')
      .eq('user_id', user_id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(1);

    if (checkError) {
      console.error('Error checking recent feedback:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (recentFeedback && recentFeedback.length > 0) {
      return NextResponse.json({ 
        error: 'You can only submit feedback once per 7 days' 
      }, { status: 429 });
    }

    const { data, error } = await supabase
      .from('governance_feedback')
      .insert({
        user_id,
        fairness_score,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
