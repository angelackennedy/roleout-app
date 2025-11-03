import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { post_id } = await request.json();

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    // Insert impression (unique constraint prevents duplicates per user per day)
    const { error: insertError } = await supabase
      .from('post_impressions')
      .insert({
        post_id,
        user_id: user.id,
        created_at: new Date().toISOString()
      });

    // Ignore unique constraint violations (user already viewed today)
    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('Error inserting impression:', insertError);
      return NextResponse.json(
        { error: 'Failed to track impression' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Impression tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
