import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('algorithm_weights')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching algorithm config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, likes_weight, comments_weight, watch_weight, description } = await req.json();
    
    if (!user?.email || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const currentVersion = await supabase
      .from('algorithm_weights')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (currentVersion.data?.version || 0) + 1;

    const { data: newConfig, error: configError } = await supabase
      .from('algorithm_weights')
      .insert({
        version: newVersion,
        likes_weight: parseFloat(likes_weight),
        comments_weight: parseFloat(comments_weight),
        watch_completion_weight: parseFloat(watch_weight),
        updated_by: user.id,
      })
      .select()
      .single();

    if (configError) {
      console.error('Error inserting config:', configError);
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    const { error: changelogError } = await supabase
      .from('algorithm_changelog')
      .insert({
        version: newVersion.toString(),
        description: description || `Updated weights: likes=${likes_weight}, comments=${comments_weight}, watch=${watch_weight}`,
        changes: {
          likes_weight: parseFloat(likes_weight),
          comments_weight: parseFloat(comments_weight),
          watch_completion_weight: parseFloat(watch_weight),
        },
        created_by: user.id,
      });

    if (changelogError) {
      console.error('Error inserting changelog:', changelogError);
    }

    return NextResponse.json(newConfig);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
