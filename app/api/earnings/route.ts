import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const { data: postMetrics, error: metricsError } = await supabase
      .from('post_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (metricsError) {
      console.error('Error fetching post metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch earnings data' },
        { status: 500 }
      );
    }

    const postsWithEarnings = (postMetrics || []).map((post: any) => {
      const fairEarnings = post.impressions * post.fair_score * 0.001;
      
      return {
        id: post.id,
        title: post.caption || 'Untitled Post',
        videoUrl: post.video_url,
        imageUrl: post.image_url,
        views: post.impressions,
        likes: post.likes,
        comments: post.comments,
        fairScore: post.fair_score,
        earnings: Number(fairEarnings.toFixed(2)),
        createdAt: post.created_at,
      };
    });

    const totalEarnings = postsWithEarnings.reduce(
      (sum, post) => sum + post.earnings,
      0
    );
    const totalViews = postsWithEarnings.reduce(
      (sum, post) => sum + post.views,
      0
    );

    const weeklyEarnings = await calculateWeeklyEarnings(supabase, userId);

    return NextResponse.json({
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalViews,
      postsCount: postsWithEarnings.length,
      posts: postsWithEarnings,
      weeklyHistory: weeklyEarnings,
    });
  } catch (error) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { error: 'Failed to load earnings data' },
      { status: 500 }
    );
  }
}

async function calculateWeeklyEarnings(supabase: any, userId: string) {
  const now = new Date();
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const { data: postMetrics } = await supabase
    .from('post_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', twelveWeeksAgo.toISOString());

  const weeklyMap = new Map<string, { earnings: number; impressions: number; posts: number }>();

  (postMetrics || []).forEach((post: any) => {
    const postDate = new Date(post.created_at);
    const weekStart = getWeekStart(postDate);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    const fairEarnings = post.impressions * post.fair_score * 0.001;
    
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { earnings: 0, impressions: 0, posts: 0 });
    }
    
    const weekData = weeklyMap.get(weekKey)!;
    weekData.earnings += fairEarnings;
    weekData.impressions += post.impressions;
    weekData.posts += 1;
  });

  const weeklyArray = Array.from(weeklyMap.entries())
    .map(([weekStart, data]) => {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      return {
        weekStart,
        weekEnd: end.toISOString().split('T')[0],
        earnings: Number(data.earnings.toFixed(2)),
        impressions: data.impressions,
        postsCount: data.posts,
      };
    })
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyArray.find(w => w.weekStart === weekKey)) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeklyArray.push({
        weekStart: weekKey,
        weekEnd: weekEnd.toISOString().split('T')[0],
        earnings: 0,
        impressions: 0,
        postsCount: 0,
      });
    }
  }

  return weeklyArray
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, 12);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
