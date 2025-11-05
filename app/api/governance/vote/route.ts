import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in to vote' },
        { status: 401 }
      );
    }

    const { fairness_score, comment } = await request.json();

    if (!fairness_score || fairness_score < 1 || fairness_score > 5) {
      return NextResponse.json(
        { error: 'Fairness score must be between 1 and 5' },
        { status: 400 }
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentVote } = await supabaseServer
      .from('governance_feedback')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(1)
      .single();

    if (recentVote) {
      return NextResponse.json(
        { error: 'You can only vote once per 7 days', canVote: false },
        { status: 429 }
      );
    }

    const { data, error } = await supabaseServer
      .from('governance_feedback')
      .insert({
        user_id: user.id,
        fairness_score,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, vote: data });
  } catch (error) {
    console.error('Error submitting governance vote:', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ canVote: false, reason: 'Not logged in' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentVote } = await supabaseServer
      .from('governance_feedback')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentVote) {
      const nextVoteDate = new Date(recentVote.created_at);
      nextVoteDate.setDate(nextVoteDate.getDate() + 7);
      
      return NextResponse.json({
        canVote: false,
        reason: 'Already voted in last 7 days',
        nextVoteDate: nextVoteDate.toISOString(),
        lastVoteDate: recentVote.created_at,
      });
    }

    return NextResponse.json({ canVote: true });
  } catch (error) {
    console.error('Error checking vote eligibility:', error);
    return NextResponse.json({ canVote: true });
  }
}
