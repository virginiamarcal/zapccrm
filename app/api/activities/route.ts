/**
 * Activities Timeline API — Story 2.3
 *
 * GET: Retrieve activity timeline for a contact
 * POST: Create new activity manually
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UUID } from '@/lib/db/schema';
import { ActivitySync } from '@/lib/bridge/activity-sync';
import { bridgeLogger } from '@/lib/bridge/logger';

const orgId = (process.env.DEFAULT_ORG_ID || 'default-org') as UUID;

/**
 * GET /api/activities?contact_id=xxx&limit=50&offset=0
 * Retrieve timeline for a contact
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contact_id') as UUID;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = (searchParams.get('orderBy') || 'desc') as 'asc' | 'desc';

    if (!contactId) {
      return NextResponse.json(
        { error: 'contact_id is required' },
        { status: 400 }
      );
    }

    const activitySync = new ActivitySync({ orgId });
    const timeline = await activitySync.getTimeline({
      contact_id: contactId,
      limit,
      offset,
      orderBy,
    });

    const counter = await activitySync.getMessageCounter(contactId);

    return NextResponse.json(
      {
        success: true,
        data: timeline,
        pagination: { limit, offset, total: counter.total_messages },
        counter,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Timeline retrieval failed:', error);
    bridgeLogger.logSyncFailure(
      'ActivitiesAPI',
      orgId,
      'get_timeline_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to retrieve timeline' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities
 * Create a new activity manually
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact_id, activity_type, content, direction, metadata } = body;

    if (!contact_id || !activity_type || !content) {
      return NextResponse.json(
        { error: 'contact_id, activity_type, and content are required' },
        { status: 400 }
      );
    }

    const activitySync = new ActivitySync({ orgId });

    // Create activity
    const activity = await activitySync.createActivityFromMessage({
      contact_id,
      text: content,
      direction: direction || 'outbound',
      timestamp: new Date().toISOString(),
      whatsapp_message_id: metadata?.whatsapp_message_id,
    });

    return NextResponse.json(
      {
        success: true,
        data: activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Activity creation failed:', error);
    bridgeLogger.logSyncFailure(
      'ActivitiesAPI',
      orgId,
      'create_activity_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
