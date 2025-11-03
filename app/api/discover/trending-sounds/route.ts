import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    const minPosts = 3; // Minimum posts to be considered trending
    
    // Calculate time threshold
    const hours = period === '24h' ? 24 : 168; // 7 days
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Get posts with sounds from the time period
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('sound_id')
      .gte('created_at', timeThreshold)
      .not('sound_id', 'is', null);

    if (postsError) throw postsError;

    // Count sound usage
    const soundCounts: Record<string, number> = {};
    posts?.forEach(post => {
      if (post.sound_id) {
        soundCounts[post.sound_id] = (soundCounts[post.sound_id] || 0) + 1;
      }
    });

    // Filter sounds with minimum usage
    const trendingSoundIds = Object.entries(soundCounts)
      .filter(([_, count]) => count >= minPosts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([soundId]) => soundId);

    if (trendingSoundIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch sound details
    const { data: sounds, error: soundsError } = await supabase
      .from('sounds')
      .select('*')
      .in('id', trendingSoundIds);

    if (soundsError) throw soundsError;

    // Combine with usage counts
    const trendingSounds = sounds?.map(sound => ({
      ...sound,
      usage_count: soundCounts[sound.id] || 0
    }))
    .sort((a, b) => b.usage_count - a.usage_count);

    return NextResponse.json({ data: trendingSounds });
  } catch (error) {
    console.error('Error fetching trending sounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending sounds' },
      { status: 500 }
    );
  }
}
