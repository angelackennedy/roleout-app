import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Log env status (server-side)
  console.log('[Health Check] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'MISSING');
  console.log('[Health Check] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...****` : 'MISSING');

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      status: 'error',
      message: 'Missing Supabase environment variables',
      env: {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
      }
    }, { status: 500 });
  }

  try {
    // Test Supabase Auth health endpoint
    const healthUrl = `${supabaseUrl}/auth/v1/health`;
    const response = await fetch(healthUrl, {
      headers: {
        'apikey': supabaseAnonKey,
      }
    });

    const data = await response.text();
    
    console.log('[Health Check] Supabase Auth Health:', response.status, data);

    return NextResponse.json({
      status: response.ok ? 'healthy' : 'unhealthy',
      supabase: {
        authHealth: response.status,
        url: supabaseUrl.slice(0, 30) + '...',
        response: data
      },
      env: {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
      }
    }, { status: response.ok ? 200 : 500 });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      env: {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
      }
    }, { status: 500 });
  }
}
