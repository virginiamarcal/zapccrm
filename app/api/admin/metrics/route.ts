/**
 * GET /api/admin/metrics — Story 1.5 AC1
 *
 * Returns super admin dashboard metrics:
 * - Total organizations
 * - Total users
 * - Message volume (last month)
 * - Activity chart (messages per day)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if user is super admin
 */
async function checkSuperAdmin(userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', userId)
    .single();

  return user?.is_super_admin || false;
}

/**
 * Get all metrics with caching
 */
async function getMetrics() {
  // In production, these would be cached with Redis (TTL 5min)
  // For now, compute fresh

  // Count total organizations
  const { data: orgs, count: totalOrgs } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' });

  // Count total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact' });

  // Count messages in last month (if messages table exists)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const { count: messagesLastMonth } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .gte('created_at', lastMonth.toISOString());

  // Get activity chart (messages per day for last 30 days)
  const { data: activityData } = await supabase
    .from('messages')
    .select('created_at')
    .gte('created_at', lastMonth.toISOString());

  // Group by day
  const activityByDay: Record<string, number> = {};
  if (activityData) {
    for (const msg of activityData) {
      const day = new Date(msg.created_at).toISOString().split('T')[0];
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    }
  }

  // Fill in missing days
  const activityChart = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = date.toISOString().split('T')[0];
    activityChart.push({
      date: day,
      count: activityByDay[day] || 0,
    });
  }

  return {
    totalOrganizations: totalOrgs || 0,
    totalUsers: totalUsers || 0,
    messagesLastMonth: messagesLastMonth || 0,
    activityChart,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AC5: Check super admin status
    const isSuperAdmin = await checkSuperAdmin(userData.user.id);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can access metrics' },
        { status: 403 }
      );
    }

    // Get metrics
    const metrics = await getMetrics();

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
