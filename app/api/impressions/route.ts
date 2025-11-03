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
    const { 
      post_id, 
      ms_watched = 0,
      liked = false,
      commented = false,
      followed_creator = false
    } = await request.json();

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    // Check if impression exists for today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingImpression } = await supabase
      .from('post_impressions')
      .select('id, ms_watched, liked, commented, followed_creator')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .gte('created_at', today)
      .single();

    if (existingImpression) {
      // Update existing impression (set watch time to new value, OR engagement flags)
      const { error: updateError } = await supabase
        .from('post_impressions')
        .update({
          ms_watched: ms_watched,
          liked: existingImpression.liked || liked,
          commented: existingImpression.commented || commented,
          followed_creator: existingImpression.followed_creator || followed_creator,
        })
        .eq('id', existingImpression.id);

      if (updateError) {
        console.error('Error updating impression:', updateError);
        return NextResponse.json(
          { error: 'Failed to update impression' },
          { status: 500 }
        );
      }
    } else {
      // Insert new impression
      const { error: insertError } = await supabase
        .from('post_impressions')
        .insert({
          post_id,
          user_id: user.id,
          ms_watched,
          liked,
          commented,
          followed_creator,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting impression:', insertError);
        return NextResponse.json(
          { error: 'Failed to track impression' },
          { status: 500 }
        );
      }
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
