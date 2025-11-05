import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: allFeedback, error } = await supabase
      .from('governance_feedback')
      .select('fairness_score, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const weeklyData: { week: string; average: number; count: number }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));

      const weekFeedback = allFeedback?.filter(fb => {
        const fbDate = new Date(fb.created_at);
        return fbDate >= weekStart && fbDate < weekEnd;
      }) || [];

      if (weekFeedback.length > 0) {
        const average = weekFeedback.reduce((sum, fb) => sum + fb.fairness_score, 0) / weekFeedback.length;
        weeklyData.push({
          week: weekEnd.toISOString().split('T')[0],
          average: Math.round(average * 100) / 100,
          count: weekFeedback.length,
        });
      }
    }

    const totalVotes = allFeedback?.length || 0;
    const overallAverage = totalVotes > 0
      ? Math.round((allFeedback?.reduce((sum, fb) => sum + fb.fairness_score, 0) || 0) / totalVotes * 100) / 100
      : 0;

    return NextResponse.json({
      weeklyData: weeklyData.reverse(),
      overallAverage,
      totalVotes,
    });
  } catch (error) {
    console.error('Error fetching governance stats:', error);
    return NextResponse.json({
      weeklyData: [],
      overallAverage: 0,
      totalVotes: 0,
    }, { status: 500 });
  }
}
