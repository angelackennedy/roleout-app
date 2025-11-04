import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const startDate30 = new Date(now);
    startDate30.setDate(startDate30.getDate() - 30);
    const startDate7 = new Date(now);
    startDate7.setDate(startDate7.getDate() - 7);
    const startDateCustom = new Date(now);
    startDateCustom.setDate(startDateCustom.getDate() - days);

    const { data: userPosts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id);

    if (postsError) {
      console.error('Error fetching user posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    const postIds = userPosts.map(p => p.id);

    if (postIds.length === 0) {
      return NextResponse.json({
        totalViews: { lifetime: 0, last7: 0, last30: 0 },
        totalLikes: { lifetime: 0, last7: 0, last30: 0 },
        totalComments: { lifetime: 0, last7: 0, last30: 0 },
        totalFollowers: { lifetime: 0, last7: 0, last30: 0 },
        dailyViews: [],
        dailyEngagement: [],
        topPosts: [],
        dailyFollowers: [],
      });
    }

    // Fetch ALL impressions (lifetime)
    const { data: allImpressions } = await supabase
      .from('post_impressions')
      .select('created_at')
      .in('post_id', postIds);

    // Fetch impressions for last 30 days
    const { data: impressions30 } = await supabase
      .from('post_impressions')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate30.toISOString());

    // Fetch impressions for last 7 days
    const { data: impressions7 } = await supabase
      .from('post_impressions')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate7.toISOString());

    // Fetch ALL likes (lifetime)
    const { data: allLikes } = await supabase
      .from('post_likes')
      .select('created_at')
      .in('post_id', postIds);

    // Fetch likes for last 30 days
    const { data: likes30 } = await supabase
      .from('post_likes')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate30.toISOString());

    // Fetch likes for last 7 days
    const { data: likes7 } = await supabase
      .from('post_likes')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate7.toISOString());

    // Fetch ALL comments (lifetime)
    const { data: allComments } = await supabase
      .from('post_comments')
      .select('created_at')
      .in('post_id', postIds);

    // Fetch comments for last 30 days
    const { data: comments30 } = await supabase
      .from('post_comments')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate30.toISOString());

    // Fetch comments for last 7 days
    const { data: comments7 } = await supabase
      .from('post_comments')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate7.toISOString());

    // Fetch ALL followers (lifetime)
    const { data: allFollowers } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id);

    // Fetch followers for last 30 days
    const { data: followers30 } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id)
      .gte('created_at', startDate30.toISOString());

    // Fetch followers for last 7 days
    const { data: followers7 } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id)
      .gte('created_at', startDate7.toISOString());

    // Build daily views and engagement maps
    const dailyViewsMap = new Map<string, number>();
    const dailyLikesMap = new Map<string, number>();
    const dailyCommentsMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyViewsMap.set(dateStr, 0);
      dailyLikesMap.set(dateStr, 0);
      dailyCommentsMap.set(dateStr, 0);
    }

    // Count views per day
    impressions30?.forEach(imp => {
      const dateStr = new Date(imp.created_at).toISOString().split('T')[0];
      dailyViewsMap.set(dateStr, (dailyViewsMap.get(dateStr) || 0) + 1);
    });

    // Count likes per day
    likes30?.forEach(like => {
      const dateStr = new Date(like.created_at).toISOString().split('T')[0];
      dailyLikesMap.set(dateStr, (dailyLikesMap.get(dateStr) || 0) + 1);
    });

    // Count comments per day
    comments30?.forEach(comment => {
      const dateStr = new Date(comment.created_at).toISOString().split('T')[0];
      dailyCommentsMap.set(dateStr, (dailyCommentsMap.get(dateStr) || 0) + 1);
    });

    // Build daily views array
    const dailyViews = Array.from(dailyViewsMap.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build daily engagement array (engagement rate = (likes + comments) / views)
    const dailyEngagement = Array.from(dailyViewsMap.keys())
      .map(date => {
        const views = dailyViewsMap.get(date) || 0;
        const likes = dailyLikesMap.get(date) || 0;
        const comments = dailyCommentsMap.get(date) || 0;
        const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
        
        return {
          date,
          engagementRate: Math.round(engagementRate * 10) / 10,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build followers growth chart (for custom days period)
    const { data: followersCustom, error: followersError } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id)
      .gte('created_at', startDateCustom.toISOString())
      .order('created_at', { ascending: true });

    const dailyFollowerCounts = new Map<string, number>();
    let cumulativeFollowers = 0;

    const { data: existingFollowers } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', user.id)
      .lt('created_at', startDateCustom.toISOString());

    cumulativeFollowers = existingFollowers?.length || 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDateCustom);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyFollowerCounts.set(dateStr, cumulativeFollowers);
    }

    followersCustom?.forEach(follow => {
      const date = new Date(follow.created_at).toISOString().split('T')[0];
      cumulativeFollowers++;
      dailyFollowerCounts.set(date, cumulativeFollowers);
      
      for (let i = 0; i < days; i++) {
        const checkDate = new Date(startDateCustom);
        checkDate.setDate(checkDate.getDate() + i);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (checkDateStr > date && dailyFollowerCounts.get(checkDateStr)! < cumulativeFollowers) {
          dailyFollowerCounts.set(checkDateStr, cumulativeFollowers);
        }
      }
    });

    const dailyFollowers = Array.from(dailyFollowerCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    const { data: topPostsData, error: topPostsError } = await supabase
      .from('posts')
      .select('id, caption, media_url, media_type, view_count, created_at')
      .eq('user_id', user.id)
      .order('view_count', { ascending: false })
      .limit(10);

    if (topPostsError) {
      console.error('Error fetching top posts:', topPostsError);
      return NextResponse.json(
        { error: 'Failed to fetch top posts' },
        { status: 500 }
      );
    }

    const topPosts = await Promise.all(
      (topPostsData || []).map(async (post) => {
        const { data: postLikes, error: postLikesError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id);

        if (postLikesError) {
          console.error('Error fetching post likes:', postLikesError);
          throw new Error('Failed to fetch post likes');
        }

        const { data: postComments, error: postCommentsError } = await supabase
          .from('post_comments')
          .select('id')
          .eq('post_id', post.id);

        if (postCommentsError) {
          console.error('Error fetching post comments:', postCommentsError);
          throw new Error('Failed to fetch post comments');
        }

        const likesCount = postLikes?.length || 0;
        const commentsCount = postComments?.length || 0;
        const viewCount = post.view_count || 0;
        const engagementRate = viewCount > 0 
          ? ((likesCount + commentsCount) / viewCount) * 100 
          : 0;

        return {
          id: post.id,
          caption: post.caption,
          media_url: post.media_url,
          media_type: post.media_type,
          views: viewCount,
          likes: likesCount,
          comments: commentsCount,
          engagementRate: Number(engagementRate.toFixed(2)),
          created_at: post.created_at,
        };
      })
    );

    return NextResponse.json({
      totalViews: {
        lifetime: allImpressions?.length || 0,
        last7: impressions7?.length || 0,
        last30: impressions30?.length || 0,
      },
      totalLikes: {
        lifetime: allLikes?.length || 0,
        last7: likes7?.length || 0,
        last30: likes30?.length || 0,
      },
      totalComments: {
        lifetime: allComments?.length || 0,
        last7: comments7?.length || 0,
        last30: comments30?.length || 0,
      },
      totalFollowers: {
        lifetime: allFollowers?.length || 0,
        last7: followers7?.length || 0,
        last30: followers30?.length || 0,
      },
      dailyViews,
      dailyEngagement,
      topPosts,
      dailyFollowers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
