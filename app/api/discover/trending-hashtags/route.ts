import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    
    // Calculate time threshold
    const hours = period === '24h' ? 24 : 168; // 7 days
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Query trending hashtags with post count
    const { data, error } = await supabase
      .rpc('get_trending_hashtags', {
        since_time: timeThreshold,
        limit_count: 20
      });

    if (error) {
      // Fallback query if function doesn't exist
      const { data: posts, error: fallbackError } = await supabase
        .from('posts')
        .select('hashtags')
        .gte('created_at', timeThreshold)
        .not('hashtags', 'is', null);

      if (fallbackError) throw fallbackError;

      // Aggregate hashtags manually
      const hashtagCounts: Record<string, number> = {};
      
      posts?.forEach(post => {
        if (Array.isArray(post.hashtags)) {
          post.hashtags.forEach((tag: string) => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        }
      });

      const trendingTags = Object.entries(hashtagCounts)
        .map(([tag, count]) => ({ tag, post_count: count }))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 20);

      return NextResponse.json({ data: trendingTags });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending hashtags' },
      { status: 500 }
    );
  }
}
