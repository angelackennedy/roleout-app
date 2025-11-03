import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    
    // Calculate time threshold
    const hours = period === '24h' ? 24 : 168; // 7 days
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Get users with recent follower growth
    const { data, error } = await supabase
      .from('follows')
      .select(`
        followed_id,
        profiles!follows_followed_id_fkey (
          id,
          username,
          avatar_url,
          bio
        )
      `)
      .gte('created_at', timeThreshold);

    if (error) throw error;

    // Aggregate follower counts
    const followerCounts: Record<string, { count: number; profile: any }> = {};
    
    data?.forEach(follow => {
      const userId = follow.followed_id;
      if (!followerCounts[userId]) {
        followerCounts[userId] = {
          count: 0,
          profile: follow.profiles
        };
      }
      followerCounts[userId].count++;
    });

    // Sort by follower growth and get top 20
    const risingCreators = Object.values(followerCounts)
      .filter(item => item.profile && item.count >= 2) // At least 2 new followers
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map(item => ({
        user_id: item.profile.id,
        username: item.profile.username,
        avatar_url: item.profile.avatar_url,
        bio: item.profile.bio,
        new_followers: item.count
      }));

    return NextResponse.json({ data: risingCreators });
  } catch (error) {
    console.error('Error fetching rising creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rising creators' },
      { status: 500 }
    );
  }
}
