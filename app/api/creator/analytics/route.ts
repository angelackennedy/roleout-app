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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

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
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        followerGrowth: 0,
        topPosts: [],
        dailyFollowers: [],
      });
    }

    const { data: impressions, error: impressionsError } = await supabase
      .from('post_impressions')
      .select('*')
      .in('post_id', postIds)
      .gte('created_at', startDate.toISOString());

    if (impressionsError) {
      console.error('Error fetching impressions:', impressionsError);
      return NextResponse.json(
        { error: 'Failed to fetch impressions' },
        { status: 500 }
      );
    }

    const totalViews = impressions?.length || 0;

    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id, created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate.toISOString());

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      );
    }

    const totalLikes = likes?.length || 0;

    const { data: comments, error: commentsError } = await supabase
      .from('post_comments')
      .select('post_id, created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate.toISOString());

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    const totalComments = comments?.length || 0;

    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return NextResponse.json(
        { error: 'Failed to fetch followers' },
        { status: 500 }
      );
    }

    const followerGrowth = followers?.length || 0;

    const dailyFollowerCounts = new Map<string, number>();
    let cumulativeFollowers = 0;

    const { data: existingFollowers, error: existingFollowersError } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', user.id)
      .lt('created_at', startDate.toISOString());

    if (existingFollowersError) {
      console.error('Error fetching existing followers:', existingFollowersError);
      return NextResponse.json(
        { error: 'Failed to fetch existing followers' },
        { status: 500 }
      );
    }

    cumulativeFollowers = existingFollowers?.length || 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyFollowerCounts.set(dateStr, cumulativeFollowers);
    }

    followers?.forEach(follow => {
      const date = new Date(follow.created_at).toISOString().split('T')[0];
      cumulativeFollowers++;
      dailyFollowerCounts.set(date, cumulativeFollowers);
      
      for (let i = 0; i < days; i++) {
        const checkDate = new Date(startDate);
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
      totalViews,
      totalLikes,
      totalComments,
      followerGrowth,
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
