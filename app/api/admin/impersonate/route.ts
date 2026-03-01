/**
 * POST /api/admin/impersonate — Story 1.5 AC3
 *
 * Allow super admin to impersonate an org member for debugging.
 * AC4: Logs all impersonation actions to audit log.
 * AC5: Only accessible to is_super_admin users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import impersonationService from '@/lib/admin/impersonation-service';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ImpersonateRequest {
  organizationId: string;
  userId: string;
  reason?: string;
}

/**
 * AC3: Create impersonation session
 */
export async function POST(request: NextRequest) {
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
    const { data: user } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', userData.user.id)
      .single();

    if (!user?.is_super_admin) {
      return NextResponse.json(
        { error: 'Only super admins can impersonate users' },
        { status: 403 }
      );
    }

    // Parse request
    const body: ImpersonateRequest = await request.json();
    const { organizationId, userId, reason } = body;

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: 'Missing organizationId or userId' },
        { status: 400 }
      );
    }

    // Start impersonation
    const session = await impersonationService.startImpersonation(
      userData.user.id,
      organizationId,
      userId,
      reason
    );

    return NextResponse.json(
      {
        success: true,
        session: {
          id: session.id,
          organizationId: session.organizationId,
          impersonatedUserId: session.impersonatedUserId,
          startedAt: session.startedAt,
        },
        message: `Now impersonating user ${userId} in organization ${organizationId}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to start impersonation:', error);
    return NextResponse.json(
      {
        error: 'Failed to start impersonation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/impersonate/end — End impersonation session
 */
export async function PUT(request: NextRequest) {
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

    // Parse request
    const body: { sessionId: string } = await request.json();
    if (!body.sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // End impersonation
    await impersonationService.endImpersonation(body.sessionId, userData.user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Impersonation session ended',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to end impersonation:', error);
    return NextResponse.json(
      {
        error: 'Failed to end impersonation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
